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

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.redirect('https://owrank.top:' + httpsPort + '/index');
});

var page = require('./page');
var components = {};

var cache_pages = [];
function getAppCallback(i) {
  function callback(req, res) {
    res.send(cache_pages[i]);
  }
  return callback;
}
function addPost(name, backend) {
  app.post('/' + name, function(req, res) {
    backend.process(req, res, components);
  });
}
for (var i = 0; i < page.pages.length; ++i) {
  var rec = page.pages[i];
  if (rec.id) {
    cache_pages[i] = page.getHTML(rec.id);
    app.get('/' + rec.id, getAppCallback(i));
  }
  if (rec.backends) {
    for (var j = 0; j < rec.backends.length; ++j) {
      var backend_name = rec.backends[j];
      var backend = require('./backends/' + backend_name);
      components[backend_name] = backend;
      addPost(backend_name, backend);
    }
  }
}

app.get('*', function(req, res) {
  res.status(404).send('Not found');
});
