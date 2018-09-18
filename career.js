var rank_data;
var common = require('./common');
var migrate = require('./migrate');
var child_process = require('child_process');
var querystring = require('querystring');
var fs = require('fs');
var mysql = require('promise-mysql');
var pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'owrank', connectionLimit: 10 });

function getCareerId(paras, callback) {
  child_process.execFile('/usr/local/bin/node',
      ['/home/node/casperjs/bin/casperjs.js', '/home/node/bl-20180714.js'].concat(paras),
      { 'env': {'ENGINE_EXECUTABLE':'/home/node/phantomjs/phantomjs'}, 'timeout': 30000 },
      callback
  );
}

function getInitConnection() {
  return mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'owrank' });
};

function putCookie(battletag, cookie) {
  pool.query("insert into battle_cookie (battletag, cookie) values (?, ?) on duplicate key update cookie=?", [battletag, cookie, cookie]);
}

function queryCookie(battletag, callback) {
  pool.query("select * from battle_cookie where battletag=?", [battletag]).then(function(rows) {
    callback(rows);
  });
}

function createSubset(obj, key) {
  obj[key] = obj[key] ? obj[key] : {};
}

function putProfile(battletag, season, hero, date, json) {
  pool.query("insert into profile (battletag, season, hero, date, json) values (?, ?, ?, ?, ?) on duplicate key update json=?", [battletag, season, hero, date, json, json]);
}

function putRank(battletag, season, date, rank, highest_rank) {
  pool.query("insert into player_rank (battletag, season, date, rank, highest_rank) values (?, ?, ?, ?, ?) on duplicate key update rank=?, highest_rank=?", [battletag, season, date, rank, highest_rank, rank, highest_rank]);
}

function putEndorsement(battletag, date, player_level, level, teammate, sportsmanship, shotcaller) {
  pool.query("insert into player_endor (battletag, date, player_level, level, teammate, sportsmanship, shotcaller) values (?, ?, ?, ?, ?, ?, ?) on duplicate key update player_level=?, level=?, teammate=?, sportsmanship=?, shotcaller=?", [battletag, date, player_level, level, teammate, sportsmanship, shotcaller, player_level, level, teammate, sportsmanship, shotcaller]);
}
function putGamedata(name, value) {
  pool.query("insert into gamedata (name, value) values (?, ?) on duplicate key update value=?", [name, value, value]);
}

function getPlayTime(data) {
  if (!data) {
    return -1;
  }
  for (var i = 0; i < data.length; ++i) {
    if (data[i].name == "游戏时间") {
      return data[i].value;
    }
  }
  return 0;
}

function gotEndor(rec) { rank_data.gotEndor(rec.level, rec.sportsmanship, rec.teammate, rec.shotcaller); }
function gotRank(season, rec) { rank_data.gotRank(season, rec.rank, rec.highest_rank); }

function getAndUpdateData(player_stat, res, pre_battletag = null) {
  if (player_stat.heroesMap) {
    putGamedata("heroesMap", JSON.stringify(player_stat.heroesMap));
  }
  var date = common.getSqlDate(new Date());
  var battletag;
  var nowSeason = null;
  if (pre_battletag) {
    battletag = pre_battletag;
  } else {
    battletag = player_stat.player.name;
  }
  var connection;
  pool.getConnection().then(function(conn) {
    connection = conn;
    return connection.query("select o.* from `profile` o left join `profile` b on o.battletag=b.battletag and o.season=b.season and o.hero=b.hero and o.date<b.date where o.battletag=? and b.date is null", [battletag]);
  }).then(function(rows) {
    var pre_stat = [];
    for (var l = 0; l < rows.length; ++l) {
      var rec = rows[l];
      createSubset(pre_stat, rec.season);
      pre_stat[rec.season][rec.hero] = JSON.parse(rec.json);
    }
    if (player_stat.seasons) {
      for (var season = 0; season < player_stat.seasons.length; ++season) {
        if (!player_stat.seasons[season]) {
          continue;
        }
        createSubset(pre_stat, season);
        var hero_data = player_stat.seasons[season];
        for (var hero_id = 0; hero_id < hero_data.length; ++hero_id) {
          var single_hero_data = hero_data[hero_id];
          var hero_name = single_hero_data.name;
          if (getPlayTime(single_hero_data.data) != getPlayTime(pre_stat[season][hero_name])) {
            pre_stat[season][hero_name] = single_hero_data.data;
            putProfile(battletag, season, hero_name, date, JSON.stringify(single_hero_data.data));
          }
        }
      }
    }
    var res_seasons = [];
    for (var i = 0; i < pre_stat.length; ++i) {
      if (pre_stat[i] == null) {
        continue;
      }
      res_seasons[i] = [];
      for (var key in pre_stat[i]) {
        if (!pre_stat[i].hasOwnProperty(key)) {
          continue;
        }
        var hero_data = {};
        hero_data.name = key;
        hero_data.data = pre_stat[i][key];
        res_seasons[i].push(hero_data);
      }
    }
    player_stat.seasons = res_seasons;
    return connection.query("select o.* from `player_rank` o left join `player_rank` b on o.battletag=b.battletag and o.season=b.season and o.date<b.date where o.battletag=? and b.date is null", [battletag]);
  }).then(function(rows) {
    if (!player_stat.player) {
      player_stat.player = {};
      player_stat.player.name = battletag;
      player_stat.player.rank = [];
    }
    for (var i = 0; i < player_stat.player.rank.length; ++i) {
      if (player_stat.player.rank[i] && player_stat.player.rank[i].rank) {
        if (rows.length == 0 || rows[0].rank != player_stat.player.rank[i].rank
                             || rows[0].highest_rank != player_stat.player.rank[i].highest_rank) {
          putRank(battletag, i, date, player_stat.player.rank[i].rank, player_stat.player.rank[i].highest_rank);
          gotRank(i, player_stat.player.rank[i]);
          if (rows.length > 0) {
            gotRank(i, rows[0]);
          }
          nowSeason = i;
        }
      }
    }
    for (var l = 0; l < rows.length; ++l) {
      var rec = rows[l];
      player_stat.player.rank[rec.season] = {rank:rec.rank, highest_rank:rec.highest_rank};
    }
    return connection.query("select o.* from `player_endor` o left join `player_endor` b on o.battletag=b.battletag and o.date<b.date where o.battletag=? and b.date is null", [battletag]);
  }).then(function(rows) {
    if (player_stat.player.endorsement && player_stat.player.level) {
      player_stat.date = date;
      var endor = player_stat.player.endorsement;
      if (rows.length == 0 || player_stat.player.level != rows[0].player_level
                           || endor.level != rows[0].level
                           || endor.teammate != rows[0].teammate
                           || endor.sportsmanship != rows[0].sportsmanship
                           || endor.shotcaller != rows[0].shotcaller) {
        putEndorsement(battletag, date, player_stat.player.level, endor.level, endor.teammate, endor.sportsmanship, endor.shotcaller);
        if (rows.length > 0) {
          gotEndor(rows[0]);
        }
        gotEndor(endor);
      }
    }
    else if (rows.length > 0) {
      var rec = rows[0];
      player_stat.player.level = rec.player_level;
      player_stat.date = common.getSqlDate(rec.date);
      player_stat.player.endorsement = {
        level: rec.level,
        teammate: rec.teammate,
        sportsmanship: rec.sportsmanship,
        shotcaller: rec.shotcaller,
      };
    } else {
      player_stat.date = "unknown";
      player_stat.player.endorsement = {
        level: 1,
        teammate: 0,
        sportsmanship: 0,
        shotcaller: 0
      };
    }
    return connection.query("select * from player_endor where battletag=? order by date asc", [battletag]);
  }).then(function(rows) {
    player_stat.player.level_history = [];
    player_stat.player.endor_history = [];
    player_stat.player.history_date = [];
    for (var i = 0; i < rows.length; ++i) {
      var rec = rows[i];
      player_stat.player.history_date.push(rec.date);
      player_stat.player.level_history.push(rec.player_level);
      player_stat.player.endor_history.push({level:rec.level, teammate:rec.teammate, sportsmanship:rec.sportsmanship, shotcaller:rec.shotcaller});
    }
    player_stat.player.history_date.push(player_stat.date);
    player_stat.player.level_history.push(player_stat.player.level);
    var rec = player_stat.player.endorsement;
    player_stat.player.endor_history.push({level:rec.level, teammate:rec.teammate, sportsmanship:rec.sportsmanship, shotcaller:rec.shotcaller});
    return connection.query("select * from player_rank where battletag=? order by date asc", [battletag]);
  }).then(function(rows) {
    player_stat.player.rank_history = [];
    for (var i = 0; i < rows.length; ++i) {
      var rec = rows[i];
      if (!player_stat.player.rank_history[rec.season]) {
        player_stat.player.rank_history[rec.season] = [];
      }
      player_stat.player.rank_history[rec.season].push({date:rec.date, rank:rec.rank, highest_rank:rec.highest_rank});
    }
    if (nowSeason) {
      if (!player_stat.player.rank_history[nowSeason]) {
        player_stat.player.rank_history[nowSeason] = [];
      }
      player_stat.player.rank_history[nowSeason].push({date:date, rank:player_stat.player.rank[nowSeason].rank, highest_rank:player_stat.player.rank[nowSeason].highest_rank});
    }
    res.send(JSON.stringify(player_stat));
    connection.release();
  });
}

function parseCareerOutput(stdout) {
  return JSON.parse(stdout.toString());
}

function getCallbackFunction(res, auto_update = false, battletag = null) {
  function callbackFunction(error, stdout, stderr) {
    try {
      var career_message = parseCareerOutput(stdout);
      var id = career_message.id;
      var cookie = career_message.cookie;
      var file_path = '/tmp/owrank-' + id;
      fs.readFile(file_path, function(error, data) {
        fs.unlink(file_path, function() {});
        var player_stat = JSON.parse(data);
        var new_battletag = player_stat.player.name;
        if (!common.notEmpty(new_battletag) && common.notEmpty(battletag)) {
          new_battletag = battletag;
          player_stat.player.name = battletag;
        }
        if (!auto_update) {
          console.log(new_battletag);
        }
        putCookie(new_battletag, cookie);
        getAndUpdateData(player_stat, res);
        if (battletag && battletag != new_battletag && common.notEmpty(new_battletag)) {
          migrate.migrate(battletag, new_battletag, rank_data);
        }
      });
    } catch (e) {
      if (battletag) {
        if (!auto_update) {
          console.log(battletag);
        }
        var player_stat = {};
        getAndUpdateData(player_stat, res, battletag);
      } else {
        res.status(404).send('Hack.');
      }
    }
  }
  return callbackFunction;
}

exports.process_career = function(req, res, o_rank_data) {
  rank_data = o_rank_data;
  var post = '';
  req.on('data', function(chunk) {
    post += chunk;
  });
  req.on('end', function() {
    post = querystring.parse(post);
    try {
      var auto_update = common.notEmpty(post.auto_update);
      if (common.notEmpty(post.battletag) && !common.notEmpty(post.cookie)) {
        if (common.notEmpty(post.no_update)) {
          var player_stat = {};
          getAndUpdateData(player_stat, res, post.battletag);
        } else {
          queryCookie(post.battletag, function (results) {
            if (results.length != 1) {
              res.status(404).send('Battle Tag Not Exist.');
              return;
            }
            getCareerId(['cookie', results[0].cookie], getCallbackFunction(res, auto_update, post.battletag));
          });
        }
      }
      else if (common.notEmpty(post.cookie)) {
        getCareerId(['cookie', post.cookie], getCallbackFunction(res));
      } else if (common.notEmpty(post.email) && common.notEmpty(post.passwd)) {
        getCareerId(['passwd', post.email, post.passwd], getCallbackFunction(res));
      } else {
        res.status(404).send('Hack.');
      }
    } catch (e) {
      res.status(404).send('Internal Error.');
    }
  });
}

function getHistoryCareer(battletag, season, hero, res) {
  pool.query("select * from profile where battletag=? and season=? and hero=?", [battletag,season,hero]).then(function (rows) {
    var his_profile = [];
    var name_map = {};
    var cnt = 0;
    for (var i = 0; i < rows.length; ++i) {
      var data = JSON.parse(rows[i].json);
      for (var j = 0; j < data.length; ++j) {
        var s_data = data[j];
        var k;
        if (name_map[s_data.name] != undefined) {
          k = name_map[s_data.name];
        } else {
          k = cnt;
          name_map[s_data.name] = cnt;
          his_profile.push({name:s_data.name,format:s_data.format,values:[]});
          ++cnt;
        }
        his_profile[k].values.push({date:rows[i].date,value:s_data.value});
      }
    }
    res.send(JSON.stringify(his_profile));
  });
}

exports.process_history_career = function(req, res) {
  var post = '';
  req.on('data', function(chunk) {
    post += chunk;
  });
  req.on('end', function() {
    post = querystring.parse(post);
    try {
      if (common.notEmpty(post.battletag) && common.notEmpty(post.season) && common.notEmpty(post.hero)) {
        getHistoryCareer(post.battletag, post.season, post.hero, res);
      } else {
        res.status(404).send('Hack.');
      }
    } catch (e) {
      res.status(404).send('Internal Error.');
    }
  });
}
