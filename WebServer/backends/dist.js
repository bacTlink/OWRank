var fs = require('fs');
var querystring = require('querystring');
var common = require('../../utils/common');
var mysql = require('promise-mysql');
var pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'owrank', connectionLimit: 10 });

function createSubset(obj, key, add = {}) {
  obj[key] = obj[key] ? obj[key] : add;
}

function getDesignation(rank) {
  if (rank < 1500) return 0;
  if (rank < 2000) return 1;
  if (rank < 2500) return 2;
  if (rank < 3000) return 3;
  if (rank < 3500) return 4;
  if (rank < 4000) return 5;
  return 6;
}

function getNewestDistribution(callback) {
  var fast_time = {};
  var rank_time = [];
  var total_fast_time = {};
  var total_rank_time = [];
  var connection;
  var pre = [];
  var rank = [];
  pool.getConnection().then(function(conn) {
    connection = conn;
    return connection.query("select count(*) as cnt from `player_rank` o left join `profile` b on o.battletag=b.battletag and o.season=b.season and o.date<b.date where b.date is null");
  }).then(function (res) {
    var cnt = res[0]["cnt"];
    var i = 0;
    var tmp_con = connection.query("select o.* from `player_rank` o left join `profile` b on o.battletag=b.battletag and o.season=b.season and o.date<b.date where b.date is null limit 0,1000");
    for (var j = 0; j < cnt; j += 1000) {
      tmp_con = tmp_con.then(function (rows) {
        for (var c = 0; c < rows.length; ++c) {
          var rec = rows[c];
          createSubset(rank, rec.season);
          rank[rec.season][rec.battletag] = getDesignation(rec.rank);
        }
        i += 1000;
        if (i < cnt) {
          return connection.query("select o.* from `player_rank` o left join `profile` b on o.battletag=b.battletag and o.season=b.season and o.date<b.date where b.date is null limit "+i+",1000");
        } else {
          return connection.query("select count(*) as cnt from `profile` where not hero=?", ["所有英雄"]);
        }
      });
    }
    return tmp_con;
  }).then(function (res_cnt) {
    var cnt = res_cnt[0]["cnt"];
    var i = 0;
    var tmp_con = connection.query("select * from `profile` where not hero=? order by date limit 0,1000", ["所有英雄"]);
    for (var j = 0; j < cnt; j += 1000) {
      tmp_con = tmp_con.then(function (rows) {
        for (var c = 0; c < rows.length; ++c) {
          var rec = rows[c];
          rec.date = common.getSqlDate(rec.date);

          var data = JSON.parse(rec.json);
          var gametime = 0;
          var winrate = -1;
          var wintime = 0;
          for (var x = 0; x < data.length; ++x) {
            if (data[x].name == "游戏时间") {
              gametime = data[x].value;
            }
            if (data[x].name == "获胜占比") {
              winrate = data[x].value;
            }
          }
          if (winrate != -1) {
            wintime = winrate * gametime;
          }

          createSubset(pre, rec.season);
          createSubset(pre[rec.season], rec.battletag);
          createSubset(pre[rec.season][rec.battletag], rec.hero);
          createSubset(pre[rec.season][rec.battletag][rec.hero], "gametime", 0);
          createSubset(pre[rec.season][rec.battletag][rec.hero], "wintime", 0);
          var pre_gametime = pre[rec.season][rec.battletag][rec.hero]["gametime"];
          var pre_wintime = pre[rec.season][rec.battletag][rec.hero]["wintime"];

          if (rec.season == 0) {
            createSubset(fast_time, rec.hero);
            createSubset(fast_time[rec.hero], rec.date);
            createSubset(fast_time[rec.hero][rec.date], "gametime", 0);
            fast_time[rec.hero][rec.date]["gametime"] += gametime - pre_gametime;

            createSubset(total_fast_time, rec.date, 0);
            total_fast_time[rec.date] += gametime - pre_gametime;
          }

          if (rank[rec.season] && rank[rec.season][rec.battletag] !== undefined) {
            var r = rank[rec.season][rec.battletag];
            createSubset(rank_time, rec.season, []);
            createSubset(rank_time[rec.season], r);
            createSubset(rank_time[rec.season][r], rec.hero);
            createSubset(rank_time[rec.season][r][rec.hero], rec.date);
            createSubset(rank_time[rec.season][r][rec.hero][rec.date], "gametime", 0);
            createSubset(rank_time[rec.season][r][rec.hero][rec.date], "wintime", 0);
            var rec_rank_data = rank_time[rec.season][r][rec.hero][rec.date];
            rec_rank_data["gametime"] += gametime - pre_gametime;
            rec_rank_data["wintime"] += wintime - pre_wintime;

            createSubset(total_rank_time, rec.season, []);
            createSubset(total_rank_time[rec.season], r);
            createSubset(total_rank_time[rec.season][r], rec.date, 0);
            total_rank_time[rec.season][r][rec.date] += gametime - pre_gametime;
          }

          pre[rec.season][rec.battletag][rec.hero]["gametime"] = gametime;
          pre[rec.season][rec.battletag][rec.hero]["wintime"] = wintime;
        }
        i += 1000;
        if (i < cnt) {
          return connection.query("select * from `profile` where not hero=? order by date limit " +i+ ",1000", ["所有英雄"]);
        } else {
          connection.release();
          callback({
            fast_time: fast_time,
            rank_time: rank_time,
            total_fast_time: total_fast_time,
            total_rank_time: total_rank_time
          });
        }
      });
    }
  });
}

var cached_distribution;

function save_dist() {
  fs.writeFile('./tmp/dist.json', JSON.stringify(cached_distribution), (err) => {});
}

fs.readFile('./tmp/dist.json', function (err, data) {
  if (!err) {
    console.log("Dist Loaded");
    cached_distribution = JSON.parse(data);
  } else {
    console.log("Dist Loading Failed");
  }
  getNewestDistribution(function (dis) {
    cached_distribution = dis;
    save_dist();
    console.log("Dist init done.");
    setInterval(function () {
      getNewestDistribution(function (dis) {
        cached_distribution = dis;
        save_dist();
        console.log('Dist updated');
      });
    }, 60 * 60 * 1000);
  });
});

function getGamedata(name, callback) {
  pool.query("select * from gamedata where name=?", name).then(function (rows) {
    if (rows.length > 0) {
      callback(rows[0].value);
    } else {
      callback(null);
    }
  });
}

exports.process = function (req, res, components) {
  var post = '';
  req.on('data', function(chunk) {
    post += chunk;
  });
  req.on('end', function() {
    post = querystring.parse(post);
    if (post.req == "seasons") {
      var seasons = [0];
      for (var i = 0; i < cached_distribution.total_rank_time.length; ++i) {
        if (cached_distribution.total_rank_time[i] != null) {
          seasons.push(i);
        }
      }
      res.send(JSON.stringify(seasons));
    } else if (post.req == "gamedata") {
      getGamedata(post.name, function (value) {
        res.send(value);
      });
    } else if (post.req == "detail_time") {
      var season = post.season;
      var rh = JSON.parse(post.rh);
      var res_time;
      if (season == 0) {
        res_time = {};
        for (var i = 0; i < rh.length; ++i) {
          res_time[rh[i].hero] = cached_distribution.fast_time[rh[i].hero];
        }
      } else {
        res_time = [];
        createSubset(res_time, season);
        for (var i = 0; i < rh.length; ++i) {
          createSubset(res_time[season], rh[i].rank);
          var rank_time = cached_distribution.rank_time;
          if (rank_time[season] && rank_time[season][rh[i].rank]) {
            res_time[season][rh[i].rank][rh[i].hero] = cached_distribution.rank_time[season][rh[i].rank][rh[i].hero];
          } else {
            res_time[season][rh[i].rank][rh[i].hero] = {};
          }
        }
      }
      res.send(JSON.stringify(res_time));
    } else if (post.req == "total_time") {
      var season = post.season;
      var ranks;
      if (season != 0) {
        ranks = JSON.parse(post.ranks);
      }
      var res_total_time;
      if (season == 0) {
        res_total_time = cached_distribution.total_fast_time;
      } else {
        res_total_time = [];
        createSubset(res_total_time, season, []);
        for (var i = 0; i < ranks.length; ++i) {
          if (cached_distribution.total_rank_time[season]) {
            res_total_time[season][ranks[i]] = cached_distribution.total_rank_time[season][ranks[i]];
          } else {
            res_total_time[season][ranks[i]] = [];
          }
        }
      }
      res.send(JSON.stringify(res_total_time));
    } else {
      res.status(404).send('Hack.');
    }
  });
}
