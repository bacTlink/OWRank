var season = null;
var design = new Set();
var heroesMap;
var hero = new Set();
var disdat = {
  fast_time: {},
  rank_time: [],
  total_fast_time: undefined,
  total_rank_time: []
};
var pickrate_chart;
var winrate_chart;
function post(callback, params = {}) {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      callback(this.responseText);
    }
  }
  xhttp.open("POST", "dist", true);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  var st = "";
  for (var key in params) {
    if (params.hasOwnProperty(key)) {
      if (st != "") {
        st += "&";
      }
      st += key + "=" + params[key];
    }
  }
  xhttp.send(st);
}
function createSubset(obj, key, add = {}) {
  obj[key] = obj[key] ? obj[key] : add;
}
function showChart() {
  pickrate_config.data.datasets = [];
  winrate_config.data.datasets = [];
  if (season === null || (season != 0 && design === null) || hero.size === 0) {
    pickrate_chart.update();
    winrate_chart.update();
    return;
  }
  for (var h of hero) {
    var pickrate_data = [];
    var winrate_data = [];
    var records;
    var totals;
    if (season == 0) {
      totals = disdat.total_fast_time;
      if (totals === undefined) {
        totals = {};
      }
      records = disdat.fast_time[h];
      if (records == undefined) {
        records = {};
      }
    } else {
      records = {}
      var rt = disdat.rank_time;
      for (var d of design) {
        if (rt[season] && rt[season][d] && rt[season][d][h]) {
          var tmp_rt = rt[season][d][h];
          for (var date in tmp_rt) {
            if (!tmp_rt.hasOwnProperty(date)) {
              continue;
            }
            createSubset(records, date);
            createSubset(records[date], "gametime", 0);
            createSubset(records[date], "wintime", 0);
            records[date]["gametime"] += tmp_rt[date]["gametime"];
            records[date]["wintime"] += tmp_rt[date]["wintime"];
          }
        }
      }
      totals = {};
      var trt = disdat.total_rank_time;
      for (var d of design) {
        if (trt[season] && trt[season][d]) {
          var tmp_trt = trt[season][d];
          for (var date in tmp_trt) {
            if (!tmp_trt.hasOwnProperty(date)) {
              continue;
            }
            createSubset(totals, date, 0);
            totals[date] += tmp_trt[date];
          }
        }
      }
    }
    var pre_gametime = 0;
    var pre_total_time = 0;
    var pre_wintime = 0;
    var dates = Object.keys(records);
    var sortByDateAsc = function (lh, rh)  { var lhs = new Date(lh); var rhs = new Date(rh); return lhs > rhs ? 1 : lhs < rhs ? -1 : 0; };
    dates.sort(sortByDateAsc);
    for (var i in dates) {
      var date = dates[i];
      if (!totals[date] || !records[date]) {
        continue;
      }
      var total_time = totals[date];
      var game_time = records[date]["gametime"];
      var win_time = 0;
      if (season !== 0) {
        win_time = records[date]["wintime"];
      }
      var D = new Date(date);
      D.setHours(0, 0, 0);
      pre_gametime += game_time;
      pre_total_time += total_time;
      pre_wintime += win_time;
      if (pre_gametime > 0 && pre_total_time > 0) {
        pickrate_data.push({x:D, y:pre_gametime / pre_total_time});
        winrate_data.push({x:D, y:pre_wintime / pre_gametime});
      }
    }
    var color = getColor(h);
    pickrate_config.data.datasets.push({
      backgroundColor: Chart.helpers.color(color.shadow).alpha(0.5).rgbString(),
      borderColor: color.color,
      type: 'line',
      label: h,
      fill: false,
      data: pickrate_data
    });
    if (season !== 0) {
      winrate_config.data.datasets.push({
      backgroundColor: Chart.helpers.color(color.shadow).alpha(0.5).rgbString(),
      borderColor: color.color,
        type: 'line',
        label: h,
        fill: false,
        data: winrate_data
      });
    }
  }
  pickrate_chart.update();
  winrate_chart.update();
}
function getTotalTime(callback) {
  if (season == 0) {
    if (disdat.total_fast_time !== undefined) {
      callback();
      return;
    }
    post(function (data) {
      disdat.total_fast_time = JSON.parse(data);
      callback();
    }, {req: "total_time", season: 0});
    return;
  }
  createSubset(disdat.total_rank_time, season, []);
  var ungot_designs = [];
  for (var d of design) {
    if (disdat.total_rank_time[season][d] === undefined) {
      ungot_designs.push(d);
    }
  }
  if (ungot_designs.length == 0) {
    callback();
    return;
  }
  post(function (data) {
    var tmp = JSON.parse(data);
    for (var i = 0; i < ungot_designs.length; ++i) {
      disdat.total_rank_time[season][ungot_designs[i]] = tmp[season][ungot_designs[i]];
    }
    callback();
  }, {req: "total_time", season: season, ranks: JSON.stringify(ungot_designs)});
}
function getDetailTime(callback) {
  if (season == 0) {
    var rh = [];
    for (var h of hero) {
      if (disdat.fast_time[h] === undefined) {
        rh.push({hero: h});
      }
    }
    if (rh.length == 0) {
      callback();
      return;
    }
    post(function (data) {
      var tmp = JSON.parse(data);
      for (var i = 0; i < rh.length; ++i) {
        disdat.fast_time[rh[i].hero] = tmp[rh[i].hero];
      }
      callback();
    }, {req: "detail_time", season: season, rh: JSON.stringify(rh)});
    return;
  }
  createSubset(disdat.rank_time, season, []);
  var rh = [];
  for (var d of design) {
    createSubset(disdat.rank_time[season], d);
    for (var h of hero) {
      if (disdat.rank_time[season][d][h] === undefined) {
        rh.push({hero: h, rank: d});
      }
    }
  }
  if (rh.length == 0) {
    callback();
    return;
  }
  post(function (data) {
    var tmp = JSON.parse(data);
    for (var i = 0; i < rh.length; ++i) {
      disdat.rank_time[season][rh[i].rank][rh[i].hero] = tmp[season][rh[i].rank][rh[i].hero];
    }
    callback();
  }, {req: "detail_time", season: season, rh: JSON.stringify(rh)});
}
function changeChart() {
  if (season === null || (season !== 0 && design.size === 0) || hero.size === 0) {
    pickrate_config.data.datasets = [];
    winrate_config.data.datasets = [];
    pickrate_chart.update();
    winrate_chart.update();
    return;
  }
  getTotalTime(function () {
    getDetailTime(showChart);
  });
}
function setSeason(obj, x) {
  $("#season-bar li").removeClass('active');
  obj.parent().addClass('active');
  season = x;
  if (x == 0) {
    $('#design-bar li').addClass('disabled');
    $('#design-bar li a').css('cursor','not-allowed');
    $('#pickrate-li a').click();
    $('#winrate-li a').removeAttr('data-toggle');
    $('#winrate-li').addClass('disabled');
  } else {
    $('#design-bar li').removeClass('disabled');
    $('#design-bar li a').css('cursor','pointer');
    $('#winrate-li a').attr('data-toggle', 'tab');
    $('#winrate-li').removeClass('disabled');
  }
  changeChart();
}
function switchDesign(obj, x) {
  if (season === 0) {
    return;
  }
  obj.parent().toggleClass('active');
  if (design.has(x)) {
    design.delete(x);
  } else {
    design.add(x);
  }
  changeChart();
}
function switchHero(obj, x) {
  obj.parent().toggleClass('active');
  if (hero.has(x)) {
    hero.delete(x);
  } else {
    hero.add(x);
  }
  changeChart();
}
function getSeasonTitle(x) {
  if (x === 0) return "快速游戏";
  return "第" + x + "赛季";
}
function getSeasons() {
  post(function(data) {
    var seasons = JSON.parse(data);
    var season_bar = "";
    for (var i = 0; i < seasons.length; ++i) {
      season_bar += "<li><a style='cursor:pointer' onclick='setSeason($(this), " + seasons[i] + ")'>" + getSeasonTitle(seasons[i]) + "</a></li>";
    }
    $('#season-bar').html(season_bar);
  }, {req: "seasons"});
}
function getDesigns() {
  var title = ["青铜","白银","黄金","铂金","钻石","大师","宗师"];
  var design_bar = "";
  for (var i = 0; i < title.length; ++i) {
    design_bar += "<li><a style='cursor:pointer' onclick='switchDesign($(this), " + i + ")'>"
        + title[i]
        + '<img style="height:35px" src="http://overwatch.nos.netease.com/images/game/rank-icons/season-2/rank-' + (i + 1) + '.png">'
        + "</a></li>";
  }
  $('#design-bar').html(design_bar + getChoose(1));
  var design_bar2 = "";
  for (var i = 0; i < title.length; ++i) {
    design_bar2 += "<li><a style='cursor:pointer' onclick='openDesignData(\"" + title[i] + "\")'>"
        + title[i]
        + '<img style="height:35px" src="http://overwatch.nos.netease.com/images/game/rank-icons/season-2/rank-' + (i + 1) + '.png">'
        + "</a></li>";
  }
  $('#design-bar2').html(design_bar2);
}
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = exdays == null ? "" : "expires="+ d.toUTCString() + ";";
  document.cookie = cname + "=" + cvalue + ";" + expires;
}
function openDesignData(title) {
  setCookie("dist_battletag", title + "玩家#0", 1);
  window.open('/index', '_blank');
}
function getColor(hero) {
  for (var key in heroesMap) {
    if (!heroesMap.hasOwnProperty(key)) {
      continue;
    }
    var hero_name = heroesMap[key].displayName;
    if (hero_name == hero) {
      return heroesMap[key].color;
    }
  }
  return '#000000';
}
function selectAllPre(x, tp) {
  var li = x.parent();
  var ul = li.parent();
  var ind = li.index();
  for (var i = ind; i >= 1; --i) {
    var a = $("li:nth-child(" + i + ") a", ul);
    var hero_name = a.html();
    if (hero_name.indexOf("反选") > 0) {
      break;
    }
    if ((!hero.has(hero_name) && tp == 0) || (tp == 1 && !design.has(i - 1))) {
      a.click();
    }
  }
}
function selectXorPre(x) {
  var li = x.parent();
  var ul = li.parent();
  var ind = li.index();
  for (var i = ind; i >= 1; --i) {
    var a = $("li:nth-child(" + i + ") a", ul);
    var hero_name = a.html();
    if (hero_name.indexOf("反选") > 0) {
      break;
    }
    if (hero_name.indexOf("全选") > 0) {
      continue;
    }
    a.click();
  }
}
function getChoose(tp) {
  var choose = "";
  choose += "<li><a style='cursor:pointer' onclick='selectAllPre($(this)," + tp + ")'><span class=\"badge\">全选</span></a></li>";
  choose += "<li><a style='cursor:pointer' onclick='selectXorPre($(this)," + tp + ")'><span class=\"badge\">反选</span></a></li>";
  return choose;
}
function getHeroes() {
  post(function(data) {
    heroesMap = JSON.parse(data);
    var hero_bar = {
      tank: "",
      support: "",
      damage: ""
    };
    for (var key in heroesMap) {
      if (!heroesMap.hasOwnProperty(key)) {
        continue;
      }
      var hero_name = heroesMap[key].displayName;
      var role = heroesMap[key].role;
      if (hero_name === "秩序之光")
        role = "damage";
      if (hero_name === "路霸")
        role = "tank";
      if (hero_name != "所有英雄") {
        var clear = "";
        if (hero_bar[role] === "") {
          clear = " style='clear:left'";
        }
        hero_bar[role] += "<li" + clear + "><a style='cursor:pointer' onclick='switchHero($(this), \"" + hero_name + "\")'>" + hero_name + "</a></li>";
      }
    }
    var choose = getChoose(0);
    $('#hero-bar').html(hero_bar["tank"] + choose + hero_bar["support"] + choose + hero_bar["damage"] + choose);
  }, {req: "gamedata", name: "heroesMap"});
}
function formatPercent(a) {
  if (null != a && "" != a && 0 != a && void 0 != a) {
    var b = parseInt(Math.round(10000 * a)) / 100 + "%";
    return b
  }
  return "--"
}
function axes_callback(label, index, labels) {
  return formatPercent(label);
}
function tooltip_callback(tooltipItem, tooltipData) {
  return tooltipData.datasets[tooltipItem.datasetIndex].label + ": " + formatPercent(tooltipItem.yLabel);
}
var pickrate_config = {
  type: 'bar',
  data: {
    datasets: [],
  },
  options: {
    responsive: true,
    legend: { display: false },
    elements: {
      line: {
        tension: 0
      }
    },
    title: {
      display: true,
      text: '使用率',
    },
    scales: {
      xAxes: [{
        type: 'time',
        display: true,
        scaleLabel: {
          display: true,
          labelString: '日期'
        },
        ticks: {
          major: {
          fontStyle: 'bold',
          fontColor: '#FF0000'
          }
        }
      }],
      yAxes: [{
        display: true,
        scaleLabel: { display: false },
        ticks: {
          callback: axes_callback
        }
      }]
    },
    tooltips: {
      callbacks: {
        label: tooltip_callback
      }
    }
  }
};
var winrate_config = {
  type: 'bar',
  data: {
    datasets: [],
  },
  options: {
    responsive: true,
    legend: { display: false },
    elements: {
      line: {
        tension: 0
      }
    },
    title: {
      display: true,
      text: '胜率',
    },
    scales: {
      xAxes: [{
        type: 'time',
        display: true,
        scaleLabel: {
          display: true,
          labelString: '日期'
        },
        ticks: {
          major: {
          fontStyle: 'bold',
          fontColor: '#FF0000'
          }
        }
      }],
      yAxes: [{
        display: true,
        scaleLabel: { display: false },
        ticks: {
          callback: axes_callback
        }
      }]
    },
    tooltips: {
      callbacks: {
        label: tooltip_callback
      }
    }
  }
};

$(document).ready(function() {
  getSeasons();
  getDesigns();
  getHeroes();
  {
    var ctx = $("#pickrate").get(0).getContext('2d');
    pickrate_chart = new Chart(ctx, pickrate_config);
  }
  {
    var ctx = $("#winrate").get(0).getContext('2d');
    winrate_chart = new Chart(ctx, winrate_config);
  }
});
