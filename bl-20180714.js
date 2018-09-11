var career_url = 'http://ow.blizzard.cn/career';
var profile_url = 'http://ow.blizzard.cn/action/career/profile';
var gamedata_url = 'http://ow.blizzard.cn/action/career/profile/gamedata';
var query_type = '';
var my_cookie = '';
var my_id = '';
var my_pwd = '';

var res = {};

function makeid() {
  var text = "";
  var possible = "QWERTYUIOPASDFGHJKLZXCVBNM0123456789qwertyuiopasdfghjklzxcvbnm";
  for (var i = 0; i < 20; ++i) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

var utils = require('utils');
var fs = require('fs');
var casper = require('casper').create({
  //verbose: true, logLevel: "info",
  pageSettings: {
    userAgent: 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36'
  },
  viewportSize: {
    width: 1920,
    height: 2080
  }
});
casper.start();
casper.then(function () {
  query_type = casper.cli.get(0);
  if (query_type == 'cookie') {
    my_cookie = casper.cli.get(1);
    phantom.addCookie({
      'name': 'bnet_user_cred',
      'value': my_cookie,
      'domain': 'ow.blizzard.cn'
    });
  } else {
    my_id = casper.cli.get(1);
    my_pwd = casper.cli.get(2);
  }
});

// Login battlenet
casper.then(function () {
  if (query_type != 'cookie') {
    casper.thenOpen(career_url, function () {});
    casper.then(function() {
      this.mouse.click('a.button.m-lg');
    });
    casper.thenEvaluate(function (id, pwd) {
      document.querySelector('[id=accountName]').value = id;
      document.querySelector('[id=password]').value = pwd;
    }, {id: my_id, pwd: my_pwd});
    casper.then(function() {
      this.mouse.click('#submit');
    });
    casper.waitForUrl(career_url, function(){}, function(){}, 15000);
    //casper.then(function () { utils.dump(phantom.cookies); });
  }
});

casper.then(function() {
  var cookies = phantom.cookies;
  for (var i = 0; i < cookies.length; ++i) {
    if (cookies[i].name == "bnet_user_cred") {
      res['cookie'] = cookies[i].value;
    }
  }
});

// Game Data
var gamedata = {};
casper.then(function() {
  gamedata_url = gamedata_url + '?' + casper.evaluate(function() {
    return (new Date).getTime();
  });
});
casper.thenOpen(gamedata_url, function () {
  tmpdata = casper.getPageContent();
  gamedata = JSON.parse(tmpdata);
});
//casper.then(function() { utils.dump(gamedata); });

// Profile Data
var profile = {};
casper.then(function() {
  profile_url = profile_url + '?' + casper.evaluate(function() {
    return (new Date).getTime();
  });
});
casper.thenOpen(profile_url, function () {
  tmpdata = casper.getPageContent();
  profile = JSON.parse(tmpdata);
});
//casper.then(function() { utils.dump(profile); });
//casper.then(function() { fs.write('tmp.json', JSON.stringify(profile), "w"); });

// Player statistics
var player_stat = {};
var parsedata = require('./parsedata');
casper.then(function() {
  player_stat = parsedata.parsedata(gamedata, profile);
});
casper.then(function() {
  var id = makeid();
  fs.write('/tmp/owrank-' + id, JSON.stringify(player_stat), "w");
  res['id'] = id;
});
//casper.then(function() { utils.dump(player_stat); });

casper.then(function() { casper.echo(JSON.stringify(res)); });

casper.run();
