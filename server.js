var express = require('express');
var app = express();
var express2 = require('express');
var app2 = express2();
var fs = require('fs');

var httpPort = process.argv[2];
var httpsPort = process.argv[3];

var http = require('http');
var httpServer = http.createServer(app2);
app2.get('*', function(req,res){
  res.redirect('https://owrank.top:'+httpsPort+req.url);
});
httpServer.listen(httpPort, function(){});

var https = require('https');
var privateKey = fs.readFileSync("cert/privkey.pem");
var certificate = fs.readFileSync("cert/fullchain.pem");
var credentials = {key: privateKey, cert: certificate};
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(httpsPort, function() {});

var career = require('./career');
var rank = require('./rank');
var distribution = require('./distribution');
var page = require('./page');

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.redirect('https://owrank.top:' + httpsPort + '/index');
});

var cache_pages = [];
function getAppCallback(i) {
  function callback(req, res) {
    res.send(cache_pages[i]);
  }
  return callback;
}
for (var i = 0; i < page.pages.length; ++i) {
  var rec = page.pages[i];
  if (rec.id) {
    cache_pages[i] = page.getHTML(rec.id);
    app.get('/' + rec.id, getAppCallback(i));
  }
}

app.get('*', function(req, res) {
  res.status(404).send('Not found');
});

app.post('/rank', function(req, res) {
  rank.process_data(req, res);
});

app.post('/career', function(req, res) {
  career.process_career(req, res, rank);
});

app.post('/dist', function(req, res) {
  distribution.process_distribution(req, res);
});

app.post('/history_career', function(req, res) {
  career.process_history_career(req, res);
});
