var common = require('../utils/common');
var querystring = require('querystring');
var https = require('https');
var mysql = require('promise-mysql');
var pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'owrank', connectionLimit: 10 });

function updateBattleTag(battletag, callback) {
  console.log('Update: ' + battletag);
  var post_data = 'battletag=' + battletag + "&auto_update=true";
  var post_options = {
    host: 'owrank.top',
    port: '443',
    path: '/career',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(post_data)
    }
  };
  var post_req = https.request(post_options, function(res) {
    res.setEncoding('utf8');
    var res_st = "";
    res.on('data', function (chunk) {
      res_st += chunk;
    });
    res.on('end', function () {
      try {
        var res_obj = JSON.parse(res_st);
        setTimeout(function() {
          if (res_obj.date !== common.getSqlDate(new Date())) {
            callback(false, callback);
          } else {
            callback(true, callback);
          }
        }, 30000);
      } catch (e) {
        setTimeout(function() {
          callback(false, callback);
        }, 30000);
      }
    });
  });
  post_req.write(post_data);
  post_req.end();
}

function updateAll(conn) {
  conn.query("select battletag from player_endor group by battletag").then(function(rows) {
    var cnt = 0, i = 0;
    if (rows.length > 0) {
      updateBattleTag(rows[i].battletag, function (done, callback) {
        if (!done) ++cnt;
        else cnt = 0;
        if (cnt >= 3 || done) {
          cnt = 0;
          ++i;
        }
        if (i < rows.length) {
          updateBattleTag(rows[i].battletag, callback);
        } else {
          updateAll(conn);
        }
      });
    }
  });
}

setTimeout(function() {
  pool.getConnection().then(function (conn) {
    updateAll(conn);
  });
}, 10000);
