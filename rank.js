var common = require('./common');
var mysql = require('promise-mysql');
var querystring = require('querystring');
var pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'owrank', connectionLimit: 10 });

function getNewestRank(callback) {
  var res = {};
  var seasons = [];
  var connection;
  pool.getConnection().then(function(conn) {
    connection = conn;
    return connection.query("select o.* from `player_endor` o left join `player_endor` b on o.battletag=b.battletag and o.date<b.date where b.date is null order by o.level desc, o.teammate + o.shotcaller + o.sportsmanship desc limit 50");
  }).then(function (rows) {
    var endor = [];
    for (var i = 0; i < rows.length; ++i) {
      var rec = rows[i];
      endor.push({
        level: rec.level,
        total: rec.teammate + rec.shotcaller + rec.sportsmanship,
        teammate: rec.teammate,
        shotcaller: rec.shotcaller,
        sportsmanship: rec.sportsmanship,
        name: common.cutBattletag(rec.battletag)
      });
    }
    res['endor'] = endor;
    return connection.query("select season from `player_rank` group by season");
  }).then(function (rows) {
    var rank = [];
    if (rows.length > 0) {
      var tmp_con = connection.query("select o.* from `player_rank` o left join `player_rank` b on o.battletag=b.battletag and o.season=b.season and o.date<b.date where b.date is null and o.season=? order by o.rank desc, o.highest_rank desc limit 50", [rows[0].season]);
      seasons[0] = rows[0].season;
      for (var i = 0; i < rows.length; ++i) {
        if (i + 1 < rows.length) {
          seasons[i + 1] = rows[i + 1].season;
        }
        var j = 0;
        tmp_con = tmp_con.then(function (rows) {
          rank[seasons[j]] = [];
          for (var c = 0; c < rows.length; ++c) {
            rec = rows[c];
            rank[seasons[j]].push({
              rank: rec.rank,
              highest_rank: rec.highest_rank,
              name: common.cutBattletag(rec.battletag)
            });
          }
          j += 1;
          if (j < seasons.length) {
            return connection.query("select o.* from `player_rank` o left join `player_rank` b on o.battletag=b.battletag and o.season=b.season and o.date<b.date where b.date is null and o.season=? order by o.rank desc, o.highest_rank desc limit 50", [seasons[j]]);
          }
          return rank;
        });
      }
      return tmp_con;
    }
    return rank;
  }).then(function (rank) {
    for (var i = 0; i < rank.length; ++i) {
      if (rank[i]) {
        res['rank' + i] = rank[i];
      }
    }
    connection.release();
    callback(res);
  });
}

var cached_rank;
var should_update;
getNewestRank( function(rank) {
  cached_rank = rank;
  should_update = false;
});
function process_rank(req, res) {
  if (should_update) {
    getNewestRank( function (rank) {
      cached_rank = rank;
      should_update = false;
      res.send(JSON.stringify(cached_rank));
    });
  } else {
    res.send(JSON.stringify(cached_rank));
  }
}

exports.gotEndor = function(level, sportsmanship, teammate, shotcaller) {
  var last;
  if (cached_rank['endor'].length > 0) {
    last = cached_rank['endor'][cached_rank['endor'].length - 1];
  } else {
    last = {
      level: -1,
      sportsmanship: -1,
      teammate: -1,
      shotcaller: -1
    };
  }
  var last_total = last.sportsmanship + last.teammate + last.shotcaller;
  var total = sportsmanship + teammate + shotcaller;
  if (level > last.level ||
      (level === last.level && total > last_total)) {
    should_update = true;
  }
}

exports.gotRank = function(season, rank, highest_rank) {
  var last;
  if (cached_rank['rank'+season].length > 0) {
    last = cached_rank['rank' + season][cached_rank['rank'+season].length - 1];
  } else {
    last = {
      rank: -1,
      highest_rank: -1
    };
  }
  if (rank > last.rank ||
      (rank === last.rank && highest_rank > last.highest_rank)) {
    should_update = true;
  }
}

exports.process_data = function(req, res) {
  var post = '';
  req.on('data', function(chunk) {
    post += chunk;
  });
  req.on('end', function() {
    post = querystring.parse(post);
    if (common.notEmpty(post.content)) {
      if (post.content == "endor") {
        process_rank(req, res);
      }
    } else {
      res.status(404).send('Hack.');
    }
  });
}
