var rank_data;
var mysql = require('promise-mysql');
var pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'owrank', connectionLimit: 10 });

function updateCookie(pre_tag, now_tag) {
  pool.query("delete from battle_cookie where battletag=?", pre_tag);
}

function gotEndor(rec) { rank_data.gotEndor(rec.level, rec.sportsmanship, rec.teammate, rec.shotcaller); }
function updateEndor(pre_tag, now_tag) {
  var connection;
  pool.getConnection().then(function (conn) {
    connection = conn;
    return connection.query("select * from player_endor where battletag=?", pre_tag);
  }).then(function (rows) {
    for (var i = 0; i < rows.length; ++i) {
      var rec = rows[i];
      pool.query("insert ignore into player_endor (battletag, date, player_level, level, teammate, sportsmanship, shotcaller) values (?, ?, ?, ?, ?, ?, ?)", [now_tag, rec.date, rec.player_level, rec.level, rec.teammate, rec.sportsmanship, rec.shotcaller]);
      gotEndor(rec);
    }
    return connection.query("delete from player_endor where battletag=?", pre_tag);
  }).then(function () {
    connection.release();
  });
}

function gotRank(season, rec) { rank_data.gotRank(season, rec.rank, rec.highest_rank); }
function updateRank(pre_tag, now_tag) {
  var connection;
  pool.getConnection().then(function (conn) {
    connection = conn;
    return connection.query("select * from player_rank where battletag=?", pre_tag);
  }).then(function (rows) {
    for (var i = 0; i < rows.length; ++i) {
      var rec = rows[i];
      pool.query("insert ignore into player_rank (battletag, season, date, rank, highest_rank) values (?, ?, ?, ?, ?)", [now_tag, rec.season, rec.date, rec.rank, rec.highest_rank]);
      gotRank(rec.season, rec);
    }
    return connection.query("delete from player_rank where battletag=?", pre_tag);
  }).then(function () {
    connection.release();
  });
}

function updateProfile(pre_tag, now_tag) {
  var connection;
  pool.getConnection().then(function (conn) {
    connection = conn;
    return connection.query("select * from profile where battletag=?", pre_tag);
  }).then(function (rows) {
    for (var i = 0; i < rows.length; ++i) {
      var rec = rows[i];
      pool.query("insert ignore into profile (battletag, season, hero, date, json) values (?, ?, ?, ?, ?)", [now_tag, rec.season, rec.hero, rec.date, rec.json]);
    }
    return connection.query("delete from profile where battletag=?", pre_tag);
  }).then(function () {
    connection.release();
  });
}

exports.migrate = function (pre_tag, now_tag, o_rank_data) {
  rank_data = o_rank_data;
  updateCookie(pre_tag, now_tag);
  updateEndor(pre_tag, now_tag);
  updateRank(pre_tag, now_tag);
  updateProfile(pre_tag, now_tag);
}
