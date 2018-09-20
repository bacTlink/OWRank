var common = require('../../utils/common');
var mysql = require('promise-mysql');
var querystring = require('querystring');
var pool = mysql.createPool({ host: 'localhost', user: 'root', password: '', database: 'owrank', connectionLimit: 10 });

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

exports.process = function(req, res, components) {
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
