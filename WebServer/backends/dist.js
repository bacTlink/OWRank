var querystring = require('querystring');
var common = require('../../utils/common');
var mysql = require('mysql');
var pmysql = require('promise-mysql');

var pool = pmysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'owrank', connectionLimit: 10 });

function createSubset(obj, key, add = {}) {
  obj[key] = obj[key] ? obj[key] : add;
}

function getAttr(data, name) {
  for (var i = 0; i < data.length; ++i) {
    if (data[i].name == name)
      return data[i].value;
  }
  return null;
}

function valid(datai) {
  if (datai.format == "percentage") return true;
  if (datai.format == "decimal_value") return true;
  if (datai.name == "单次存活时伤害总量") return true;
  if (datai.format == "per_10_minutes") return true;
  if (datai.format == "time_per_10_minutes") return true;
  return false;
}

function addAttrs(res, data1) {
  for (var i = 0; i < data1.length; ++i) {
    if (valid(data1[i])) {
      if (getAttr(res, data1[i].name) === null) {
        res.push({
          name: data1[i].name,
          value: 0,
          format: data1[i].format
        });
      }
    }
  }
}

function addData(data1, data2) {
  var res = [];
  var time1 = getAttr(data1, "游戏时间");
  var time2 = getAttr(data2, "游戏时间");
  var total_time = time1 + time2;
  res.push({
    name: "游戏时间",
    value: total_time,
    format: "duration"
  });
  addAttrs(res, data1);
  addAttrs(res, data2);
  for (var i = 1; i < res.length; ++i) {
    var v1 = getAttr(data1, res[i].name);
    var v2 = getAttr(data2, res[i].name);
    res[i].value = (v1 * time1 + v2 * time2) / total_time;
  }
  return res;
}

function subData(data1, data2) {
  var res = [];
  var time1 = getAttr(data1, "游戏时间");
  var time2 = getAttr(data2, "游戏时间");
  if (time1 - time2 < 1e-4) {
    return res;
  }
  var total_time = time1 - time2;
  res.push({
    name: "游戏时间",
    value: total_time,
    format: "duration"
  });
  addAttrs(res, data1);
  for (var i = 1; i < res.length; ++i) {
    var v1 = getAttr(data1, res[i].name);
    var v2 = getAttr(data2, res[i].name);
    res[i].value = (v1 * time1 - v2 * time2) / total_time;
  }
  return res;
}

function getNewestDistribution(start_date, end_date) {
  var connection = mysql.createConnection({
    host            : 'localhost',
    user            : 'root',
    password        : '',
    database        : 'owrank'
  });
  var acctime = [];
  var avg_data = [];
  connection.query('select * from profile where date>=? and date<=? order by date', [common.getSqlDate(start_date), common.getSqlDate(end_date)]).on('result', function (rec) {
    connection.pause();
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
    pool.query('select * from player_rank where battletag=? and season=? and date<=? order by date desc limit 1', [rec.battletag, rec.season, rec.date]).then(function (recs) {
      rec.rank = 0;
      if (recs[0]) {
        rec.rank = common.getRank(recs[0].rank);
      } else if (rec.season != 0) {
        connection.resume();
        return;
      }
      pool.query('select * from profile where battletag=? and season=? and hero=? and date<? order by date desc limit 1', [rec.battletag, rec.season, rec.hero, rec.date]).then(function (recs) {
        var pre_gametime = 0;
        var pre_wintime = 0;
        var data2 = [];
        if (recs[0]) {
          data2 = JSON.parse(recs[0].json);
          var winrate = -1;
          for (var x = 0; x < data2.length; ++x) {
            if (data2[x].name == "游戏时间") {
              pre_gametime = data2[x].value;
            } else if (data2[x].name == "获胜占比") {
              winrate = data2[x].value;
            }
          }
          if (winrate != -1) {
            pre_wintime = winrate * pre_gametime;
          }
        } else if (rec.season == 0) {
          connection.resume();
          return;
        }

        createSubset(acctime, rec.season, []);
        createSubset(acctime[rec.season], rec.rank);
        createSubset(acctime[rec.season][rec.rank], rec.date);
        createSubset(acctime[rec.season][rec.rank][rec.date], rec.hero);
        createSubset(acctime[rec.season][rec.rank][rec.date][rec.hero], "gametime", 0);
        createSubset(acctime[rec.season][rec.rank][rec.date][rec.hero], "wintime", 0);

        acctime[rec.season][rec.rank][rec.date][rec.hero]["gametime"] += gametime - pre_gametime;
        acctime[rec.season][rec.rank][rec.date][rec.hero]["wintime"] += wintime - pre_wintime;

        if (rec.season > 0) {
          createSubset(avg_data, rec.rank, []);
          createSubset(avg_data[rec.rank], rec.season);
          createSubset(avg_data[rec.rank][rec.season], rec.hero);
          createSubset(avg_data[rec.rank][rec.season][rec.hero], rec.date, []);
          avg_data[rec.rank][rec.season][rec.hero][rec.date] = addData(
            avg_data[rec.rank][rec.season][rec.hero][rec.date],
            subData(data, data2)
          );
        }

        connection.resume();
      });
    });
  }).on('end', function () {
    for (var season = 0; season < acctime.length; ++season)
    if (acctime[season] != null) {
      for (var rank = 0; rank < acctime[season].length; ++rank)
      if (acctime[season][rank] != null) {
        for (var date in acctime[season][rank])
        if (acctime[season][rank].hasOwnProperty(date)) {
          var total_gametime = 0, total_wintime = 0;
          for (var hero in acctime[season][rank][date])
          if (acctime[season][rank][date].hasOwnProperty(hero)) {
            var rec = acctime[season][rank][date][hero];
            if (rec["gametime"] > 0 || rec["wintime"] > 0) {
              total_gametime += rec["gametime"];
              total_wintime += rec["wintime"];
              pool.query("insert into gametime (season, rank, hero, date, gametime, wintime) values (?, ?, ?, ?, ?, ?) on duplicate key update gametime=?, wintime=?", [season, rank, hero, date, rec["gametime"], rec["wintime"], rec["gametime"], rec["wintime"]]);
            }
          }
          if (total_gametime > 0 || total_wintime > 0) {
            pool.query("insert into gametime (season, rank, hero, date, gametime, wintime) values (?, ?, ?, ?, ?, ?) on duplicate key update gametime=?, wintime=?", [season, rank, "全部英雄", date, total_gametime, total_wintime, total_gametime, total_wintime]);
          }
        }
      }
    }
    for (var rank = 0; rank < avg_data.length; ++rank)
    if (avg_data[rank] != null) {
      var battletag = common.rankNames[rank] + "玩家#0";
      for (var season = 0; season < avg_data[rank].length; ++season)
      if (avg_data[rank][season] != null) {
        for (var hero in avg_data[rank][season])
        if (avg_data[rank][season].hasOwnProperty(hero)) {
          (function (battletag, rank, season, hero) {
            pool.query("select * from profile where battletag=? and season=? and hero=? and date<? order by date desc limit 1", [battletag, season, hero, start_date]).then(function (rows) {
              var data = [];
              if (rows[0]) {
                data = JSON.parse(rows[0].json);
              }
              var dates = Object.keys(avg_data[rank][season][hero]);
              var sortByDateAsc = function (lh, rh)  { var lhs = new Date(lh); var rhs = new Date(rh); return lhs > rhs ? 1 : lhs < rhs ? -1 : 0; };
              dates.sort(sortByDateAsc);
              var avg = avg_data[rank][season][hero];
              avg[dates[0]] = addData(avg[dates[0]], data);
              for (var i = 1; i < dates.length; ++i) {
                avg[dates[i]] = addData(avg[dates[i - 1]], avg[dates[i]]);
              }
              for (var i = 0; i < dates.length; ++i) {
                var json = JSON.stringify(avg[dates[i]]);
                pool.query("insert into profile (battletag, season, hero, date, json) values (?, ?, ?, ?, ?) on duplicate key update json=?", [battletag, season, hero, dates[i], json, json]);
              }
            });
          })(battletag, rank, season, hero);
        }
      }
    }
    connection.end();
  });
}

//getNewestDistribution(new Date("2018-10-20"), new Date("2018-10-31"));

function update3day() {
  var b = new Date();
  var a = new Date();
  a.setTime(b.getTime() - 3 * 24 * 60 * 60 * 1000);
  getNewestDistribution(a, b);
}

update3day();
setInterval(function () {
  update3day();
}, 60 * 60 * 1000);

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
      pool.query("select * from gametime group by season").then(function (rows) {
        var seasons = []
        for (var i = 0; i < rows.length; ++i) {
          seasons.push(rows[i].season);
        }
        res.send(JSON.stringify(seasons));
      });
    } else if (post.req == "gamedata") {
      getGamedata(post.name, function (value) {
        res.send(value);
      });
    } else if (post.req == "detail_time") {
      var season = post.season;
      var rh = JSON.parse(post.rh);
      var req_str = "select * from gametime where season=? and (";
      var param = [season];
      for (var i = 0; i < rh.length; ++i) {
        if (season == 0) {
          rh[i].rank = 0;
        }
        req_str += i == 0 ? "" : " or ";
        req_str += "(rank=? and hero=?)";
        param.push(rh[i].rank, rh[i].hero);
      }
      req_str += ")";
      pool.query(req_str, param).then(function (rows) {
        var res_time;
        if (season == 0) {
          res_time = {};
          for (var i = 0; i < rows.length; ++i) {
            var rec = rows[i];
            createSubset(res_time, rec.hero);
            createSubset(res_time[rec.hero], rec.date);
            res_time[rec.hero][rec.date]["gametime"] = rec.gametime;
            res_time[rec.hero][rec.date]["wintime"] = rec.wintime;
          }
        } else {
          res_time = [];
          createSubset(res_time, season);
          for (var i = 0; i < rows.length; ++i) {
            var rec = rows[i];
            createSubset(res_time[season], rec.rank);
            createSubset(res_time[season][rec.rank], rec.hero);
            createSubset(res_time[season][rec.rank][rec.hero], rec.date);
            res_time[season][rec.rank][rec.hero][rec.date]["gametime"] = rec.gametime;
            res_time[season][rec.rank][rec.hero][rec.date]["wintime"] = rec.wintime;
          }
        }
        //console.log(res_time);
        res.send(JSON.stringify(res_time));
      });
    } else if (post.req == "total_time") {
      var season = post.season;
      var ranks = [0];
      if (season != 0) {
        ranks = JSON.parse(post.ranks);
      }
      var req_str = "select * from gametime where season=? and hero=? and (";
      var param = [season, "全部英雄"];
      for (var i = 0; i < ranks.length; ++i) {
        req_str += i == 0 ? "" : " or ";
        req_str += "rank=?";
        param.push(ranks[i]);
      }
      req_str += ")";
      pool.query(req_str, param).then(function (rows) {
        var res_total_time;
        if (season == 0) {
          res_total_time = {};
          for (var i = 0; i < rows.length; ++i) {
            var rec = rows[i];
            res_total_time[rec.date] = rec.gametime;
          }
        } else {
          res_total_time = [];
          createSubset(res_total_time, season, []);
          for (var i = 0; i < rows.length; ++i) {
            var rec = rows[i];
            createSubset(res_total_time[season], rec.rank);
            res_total_time[season][rec.rank][rec.date] = rec.gametime;
          }
        }
        //console.log(res_total_time);
        res.send(JSON.stringify(res_total_time));
      });
    } else {
      res.status(404).send('Hack.');
    }
  });
}
