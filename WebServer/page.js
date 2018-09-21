var pages = [
  {
    id: 'index',
    title: '个人数据',
    css: ['bootstrap', 'bootstrap-theme', 'ie10-bug', 'owrank-theme'],
    content: 'personal_data.html',
    scripts: ['jquery', 'bootstrap', 'ie10-bug', 'chartjs', 'js/data.js'],
    backends: ['career', 'history_career']
  },
  {
    id: 'rank',
    title: '排行榜',
    css: ['bootstrap', 'bootstrap-theme', 'ie10-bug', 'owrank-theme'],
    content: 'rank.html',
    scripts: ['jquery', 'bootstrap', 'ie10-bug', 'js/rank.js'],
    backends: ['rank']
  },
  {
    id: 'dist',
    title: '英雄使用数据',
    css: ['bootstrap', 'bootstrap-theme', 'ie10-bug', 'owrank-theme'],
    content: 'dist.html',
    scripts: ['jquery', 'bootstrap', 'ie10-bug', 'chartjs', 'js/dist.js'],
    backends: ['dist']
  },
  {
    title: '关于',
    always: true,
    opt: {href:'#', 'data-toggle':'modal', 'data-target':'#about-modal'},
    'pull-right': true,
    css: ['bootstrap', 'bootstrap-theme', 'ie10-bug', 'owrank-theme'],
    content: 'about.html',
    scripts: ['jquery', 'bootstrap', 'ie10-bug']
  },
  {
    title: '更新日志',
    always: true,
    opt: {href:'#', 'data-toggle':'modal', 'data-target':'#update-modal'},
    'pull-right': true,
    css: ['bootstrap', 'bootstrap-theme', 'ie10-bug', 'owrank-theme'],
    content: 'log.html',
    scripts: ['jquery', 'bootstrap', 'ie10-bug']
  }
];

var common_css = {
  bootstrap: {
    href: "https://stackpath.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css",
    testHTML: "<div id='bootstrapCssTest' class='hidden'></div>",
    fallback: '$(function() { if ($("#bootstrapCssTest").is(":visible")) { $("head").prepend(\'<link rel="stylesheet" href="css/bootstrap.min.css">\'); } });'
  },
  'bootstrap-theme': {
    href: "https://stackpath.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css"
  },
  'ie10-bug': {
    href: "css/ie10-viewport-bug-workaround.css"
  },
  'owrank-theme': {
    href:"css/theme.css"
  }
};

var common_scripts = {
  jquery: {
    src: "https://code.jquery.com/jquery-1.12.4.min.js",
    fallback: "window.jQuery || document.write('<script src=\"js/jquery.min.js\"><\\\/script>')"
  },
  bootstrap: {
    src: "https://stackpath.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js",
    fallback: "if(typeof($.fn.modal) === 'undefined') {document.write('<script src=\"js/bootstrap.min.js\"><\\\/script>')}"
  },
  'ie10-bug': {
    src: "js/ie10-viewport-bug-workaround.js"
  },
  'chartjs': {
    src: "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.2/Chart.bundle.min.js",
    fallback: "if(typeof(Chart) === 'undefined') {document.write('<script src=\"js/Chart.bundle.min.js\"><\\\/script>')}"
  }
};

var fs = require('fs');
for (var i = 0; i < pages.length; ++i) {
  pages[i].HTMLcontent = fs.readFileSync(__dirname + '/public/' + pages[i].content);
}

String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

function getElementStart(name, opt) {
  var res = "";
  res += '<' + name;
  for (var key in opt) {
    if (!opt.hasOwnProperty(key)) {
      continue;
    }
    res += ' ' + key + '="' + opt[key].replaceAll('"', '\\"') + '"';
  }
  res += '>'
  return res;
}

function getElementEnd(name) {
  return '</' + name + '>';
}

function getElement(name, opt) {
  return getElementStart(name, opt) + getElementEnd(name);
}

String.prototype.wrapBy = function(name, opt) {
  var target = this;
  return getElementStart(name, opt) + target + getElementEnd(name);
};


function getCombine(id, key) {
  var res = {};
  for (var i = 0; i < pages.length; ++i) {
    if (pages[i].id === id || pages[i].always) {
      var i_key = pages[i][key];
      for (var j = 0; j < i_key.length; ++j) {
        res[i_key[j]] = true;
      }
    }
  }
  return Object.keys(res);
}

function getHead(id) {
  var css = getCombine(id, 'css');
  var res = '';
  res += getElementStart('meta', {charset:'utf-8'});
  res += getElementStart('meta', {'http-equiv':'X-UA-Compatible', content:'IE=edge'});
  res += getElementStart('meta', {name:'viewport', content:'width=device-width, initial-scale=1'});
  res += getElementStart('meta', {name:'description', content:'守望先锋生涯查询-守望先锋排行榜'});
  res += getElementStart('meta', {name:'author', content:'OW Rank'});
  res += 'OWRank'.wrapBy('title');
  res += getElementStart('link', {rel:'shortcut icon', type:'image/icon', href:'pics/owrank.ico'});
  for (var i = 0; i < css.length; ++i) {
    if (common_css[css[i]]) {
      var rec = common_css[css[i]];
      res += getElementStart('link', {href:rec.href, rel:'stylesheet'});
    } else {
      res += getElementStart('link', {href:css[i], rel:'stylesheet'});
    }
  }
  return res.wrapBy('head');
}

function getNavbar(id) {
  var span = getElement('span', {class:'icon-bar'});
  span = span + span + span;
  var col_button = span.wrapBy('button', {type:'button', class:'navbar-toggle', 'data-toggle':'collapse', 'data-target':'#owrank-navbar'});
  var brand = "OW Rank".wrapBy('a', {class:'navbar-brand'});
  var header = (brand + col_button).wrapBy('div', {class:'navbar-header'});
  var lis = "";
  var right_lis = "";
  for (var i = 0; i < pages.length; ++i) {
    var opt = pages[i].opt ? pages[i].opt : {};
    if (pages[i].id) {
      opt.href = pages[i].id;
    }
    var li_opt = id === pages[i].id ? {class:'active'} : {};
    var li = pages[i].title.wrapBy('a', opt).wrapBy('li', li_opt);
    if (pages[i]['pull-right']) {
      right_lis += li;
    } else {
      lis += li;
    }
  }
  var col = lis.wrapBy('ul', {class: 'nav navbar-nav'}) + right_lis.wrapBy('ul', {class: 'nav navbar-nav navbar-right'});
  col = col.wrapBy('div', {class: 'navbar-collapse collapse', id:"owrank-navbar"});
  var container = (header + col).wrapBy('div', {class:'container'});
  return container.wrapBy('nav', {class:'navbar navbar-inverse navbar-fixed-top'});
}

function getScripts(id) {
  var css = getCombine(id, 'css');
  var scripts = getCombine(id, 'scripts');
  var res = "";
  for (var i = 0; i < scripts.length; ++i) {
    if (common_scripts[scripts[i]]) {
      var rec = common_scripts[scripts[i]];
      res += getElement('script', {src: rec.src});
      res += '\n';
      if (rec.testHTML) {
        res += rec.testHTML;
        res += '\n';
      }
      if (rec.fallback) {
        res += rec.fallback.wrapBy('script');
        res += '\n';
      }
    } else {
      res += getElement('script', {src: scripts[i]});
      res += '\n';
    }
  }
  for (var i = 0; i < css.length; ++i) {
    if (common_css[css[i]]) {
      var rec = common_css[css[i]];
      if (rec.testHTML) {
        res += rec.testHTML;
        res += '\n';
      }
      if (rec.fallback) {
        res += rec.fallback.wrapBy('script');
        res += '\n';
      }
    }
  }
  return res;
}

function getFooter() {
  var text = "© 2018 bacTlink and contributors. © 2018 Blizzard.";
  return text.wrapBy('div', {class: 'footer-copyright text-center py-3'}).wrapBy('footer');
}

function getBody(id) {
  var HTMLcontent = "";
  for (var i = 0; i < pages.length; ++i) {
    if (pages[i].id === id || pages[i].always) {
      HTMLcontent += pages[i].HTMLcontent;
    }
  }
  return (getNavbar(id) + HTMLcontent + getFooter() + getScripts(id)).wrapBy('body');
}

function getHTML(id) {
  var res = "<!DOCTYPE html>";
  res += (getHead(id) + getBody(id)).wrapBy('html', {lang:'en'});
  return res;
}

exports.pages = pages;
exports.getHTML = getHTML;
