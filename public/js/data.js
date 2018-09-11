$("#level-history-title").on("click", function() {$("#level-history-div").toggle();});
$("#endor-level-history-title").on("click", function() {$("#endor-level-history-div").toggle();});
$("#endor-history-title").on("click", function() {$("#endor-history-div").toggle();});
$("#submit-button").on("click", function() {
  setCookie("no_update", "", 0);
  owrank_data.sendRequest(current_pre);}
);
$("#cookie-a").on("click", function() {qmethod('cookie');});
$("#passwd-a").on("click", function() {qmethod('passwd');});
$("#battletag-a").on("click", function() {qmethod('battletag');});
$('#refresh-button').on("click", function() {
  setCookie("no_update", "", 0);
  $('#battletag-a').click();
  $('#battletag').val(owrank_data.data.player.name);
  $('#submit-button').click();
});
var current_pre = "cookie";
var patterns = {battletag: "^.*#[0-9]+$", cookie: "^[0-9a-zA-Z.%]+$", email:"^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$"};
function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = exdays == null ? "" : "expires="+ d.toUTCString() + ";";
  document.cookie = cname + "=" + cvalue + ";" + expires;
}
function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
  return undefined;
}
function qmethod(id_pre) {
  $('#' + current_pre + '-div').toggle();
  $('#' + current_pre + '-li').removeClass("active");
  var objstr;
  objstr = current_pre == "passwd" ? "email" : current_pre;
  $('#' + objstr).prop('required',false);
  $('#' + objstr).attr('pattern',".*");
  current_pre = id_pre;
  $('#' + current_pre + '-div').toggle();
  $('#' + current_pre + '-li').addClass("active");
  objstr = current_pre == "passwd" ? "email" : current_pre;
  $('#' + objstr).prop('required',true);
  $('#' + objstr).attr('pattern',patterns[objstr]);
}
var add_cookie_gif = false;
$('#message-modal').on('shown.bs.modal', function(event) {
  var position = $('#'+current_pre+'-modal-div').position();
  $('#message-modal').animate({ scrollTop: position.top }, "slow");
  if (!add_cookie_gif) {
    $('#cookie-modal-div').html($('#cookie-modal-div').html() + '<img src="pics/cookie.gif" alt="cookie method" style="width:100%">');
    add_cookie_gif = true;
  }
});
var owrank_data = {
  cur_season: -1,
  data: null,
  doughnut_config: {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [0,0,0,0],
        backgroundColor: ['rgb(46,177,49)','rgb(189,11,234)','rgb(215,129,13)','rgb(32, 40, 198)'],
        label: 'endor-count'
      }],
      labels: ['竞技风范','团队精神','出色指挥','赞赏总数']
    },
    options: {
      responsive: true,
      legend: { position: 'left' },
      title: {
        display: true,
        text: '赞赏数量'
      },
      animation: { animateScale: true, animateRotate: true }
    }
  },
  showPlayerMessage: function() {
    $("#user-name").html(this.data.player.name + "的生涯");
    $("#level").html(this.data.player.level);
    var endor = this.data.player.endorsement;
    $("#endor-level").html(endor.level);
    var total = endor.sportsmanship+endor.teammate+endor.shotcaller;
    $("#endor-total").html(total);
    var endor_chart_data = this.doughnut_config.data.datasets[0].data;
    endor_chart_data[0] = endor.sportsmanship;
    endor_chart_data[1] = endor.teammate;
    endor_chart_data[2] = endor.shotcaller;
    this.doughnut.update();
    $("#update-date").html("更新时间："+this.data.date);
    for (var i = 0; i < 4; ++i) {
      this.endor_history_chart_config.data.datasets[i].data = [];
    }
    this.level_history_chart_config.data.datasets[0].data = [];
    this.endor_level_history_chart_config.data.datasets[0].data = [];
    var endor_history_chart_datasets = this.endor_history_chart_config.data.datasets;
    var level_history_chart_data = this.level_history_chart_config.data.datasets[0].data;
    var endor_level_history_chart_data = this.endor_level_history_chart_config.data.datasets[0].data;
    var endor_history = this.data.player.endor_history;
    var level_history = this.data.player.level_history;
    var history_date = this.data.player.history_date;
    for (var i = 0; i < history_date.length; ++i) {
      var date = new Date(history_date[i]);
      date.setHours(0, 0, 0);
      endor_history_chart_datasets[0].data.push({x:date, y:endor_history[i].sportsmanship});
      endor_history_chart_datasets[1].data.push({x:date, y:endor_history[i].teammate});
      endor_history_chart_datasets[2].data.push({x:date, y:endor_history[i].shotcaller});
      endor_history_chart_datasets[3].data.push({x:date, y:endor_history[i].sportsmanship + endor_history[i].teammate + endor_history[i].shotcaller});
      level_history_chart_data.push({x:date, y:level_history[i]});
      endor_level_history_chart_data.push({x:date, y:endor_history[i].level});
    }
    this.endor_history_chart.update();
    this.level_history_chart.update();
    this.endor_level_history_chart.update();
  },
  loadData: function(season_index) {
    var season_bar = $("#season-bar-" + this.cur_season);
    var season_data = $("#season-data-" + this.cur_season);
    season_bar.removeClass("active");
    season_data.toggle();
    this.cur_season = season_index;
    season_bar = $("#season-bar-" + this.cur_season);
    season_data = $("#season-data-" + this.cur_season);
    season_bar.addClass("active");
    season_data.toggle();
  },
  formatValue: function(a) {
    switch (a.format) {
      case "rounded_value":
        return Number(this.formatLargeNum(a.value)) ? Math.round(this.formatLargeNum(a.value)) : this.formatLargeNum(a.value);
      case "duration":
        return this.formatTime(a.value);
      case "percentage":
        return this.formatPercent(a.value);
      case "decimal_value":
        return this.formatLargeNum(a.value);
      case "time":
        return this.formatShortTime(a.value);
      case "per_10_minutes":
        return this.formatLargeNum(600 * a.value);
      case "time_per_10_minutes":
        return this.formatShortTime(600 * a.value);
      default:
        return this.formatLargeNum(a.value)
    }
  },
  formatLargeNum: function(a) {
    if (null != a && "" != a && 0 != a && void 0 != a) {
      var a = parseFloat(a.toFixed(2));
      return a
    }
    return "--"
  },
  formatShortTime: function(a) {
    return a = null != a && "" != a && 0 != a && void 0 != a ? a > 60 && 3600 > a ? "00:" + (parseInt(a / 60) > 9 ? parseInt(a / 60) : "0" + parseInt(a / 60)) + ":" + (parseInt(60 * (parseFloat(a / 60) - parseInt(a / 60))) > 9 ? parseInt(60 * (parseFloat(a / 60) - parseInt(a / 60))) : "0" + parseInt(60 * (parseFloat(a / 60) - parseInt(a / 60)))) : a >= 3600 && 86400 > a ? (parseInt(a / 3600) > 9 ? parseInt(a / 3600) : "0" + parseInt(a / 3600)) + ":" + (parseInt(60 * (parseFloat(a / 3600) - parseInt(a / 3600))) > 9 ? parseInt(60 * (parseFloat(a / 3600) - parseInt(a / 3600))) : "0" + parseInt(60 * (parseFloat(a / 3600) - parseInt(a / 3600)))) + ":" + (parseInt(60 * (parseFloat(60 * (parseFloat(a / 3600) - parseInt(a / 3600))) - parseInt(60 * (parseFloat(a / 3600) - parseInt(a / 3600))))) > 9 ? parseInt(60 * (parseFloat(60 * (parseFloat(a / 3600) - parseInt(a / 3600))) - parseInt(60 * (parseFloat(a / 3600) - parseInt(a / 3600))))) : "0" + parseInt(60 * (parseFloat(60 * (parseFloat(a / 3600) - parseInt(a / 3600))) - parseInt(60 * (parseFloat(a / 3600) - parseInt(a / 3600)))))) : "00:00:" + (parseInt(a) > 9 ? parseInt(a) : "0" + parseInt(a)) : "--"
  },
  formatTime: function(a) {
    return a = null != a && "" != a && 0 != a && void 0 != a ? a > 60 && 3600 > a ? Math.round(a / 60) + "分钟" : a >= 3600 ? Math.floor(a / 3600) + "小时" + this.formatLeftTime(a % 3600) : "<1分钟" : "--"
  },
  formatLeftTime: function(a) {
    return a > 60 ? Math.round(a / 60) + "分钟" : "";
  },
  formatPercent: function(a) {
    if (null != a && "" != a && 0 != a && void 0 != a) {
      var b = parseInt(Math.round(10000 * a)) / 100 + "%";
      return b
    }
    return "--"
  },
  getSeasonDetailData: function(season_index, sortkey) {
    season_data = this.data.seasons[season_index];
    var title = ["游戏时间", "获胜占比", "平均每10分钟消灭", "平均每10分钟对英雄伤害量", "平均每10分钟治疗量", "平均每10分钟阵亡", "武器命中率", "暴击命中率"];
    var res = "";
    res += "<table class=\"table table-striped table-responsive text-nowrap\">";
    res += "<thead><tr>";
    res += "<th>英雄</th>";
    var tmptitle = [];
    for (var x = 0; x < title.length; ++x) {
      var ok = false;
      for (var i = 0; i < season_data.length; ++i) {
        if (season_data[i].data.length == 0) {
          continue;
        }
        var flag = false;
        for (var j = 0; j < season_data[i].data.length; ++j) {
          if (season_data[i].data[j].name == title[x]) {
            flag = true;
            break;
          }
        }
        if (flag == true) {
          ok = true;
          break;
        }
      }
      if (ok) tmptitle.push(title[x]);
    }
    title = tmptitle;
    for (var i = 0; i < title.length; ++i) {
      res += "<th><a style=\"cursor:pointer\" onclick=\"owrank_data.sortSeasonDetailData(" + season_index + ",\'" + title[i] + "\')\">" + title[i] + "</a></th>";
    }
    res += "</thead></tr>";
    res += "<tbody>";
    var tmplists = [];
    for (var i = 0; i < season_data.length; ++i) {
      var tkey = 0;
      var tkey0 = 0;
      var pros = "";
      pros += "<tr>";
      if (season_data[i].data.length == 0) {
        pros += "<td>" + season_data[i].name + "</td>";
      } else {
        pros += "<td><a onclick=\"owrank_data.showHeroModal(" + season_index + "," + i + ");\" style=\"cursor:pointer\" data-toggle=\"modal\" data-target=\"#hero-modal\">" + season_data[i].name + "</a></td>";
      }
      for (var x = 0; x < title.length; ++x) {
        var pro = "";
        var found = false;
        for (var j = 0; j < season_data[i].data.length; ++j) {
          if (season_data[i].data[j].name == title[x]) {
            found = true;
            pro += "<td>";
            pro += this.formatValue(season_data[i].data[j]);
            if (title[x] == sortkey) {
              tkey = parseFloat(season_data[i].data[j].value);
            }
            if (title[x] == "游戏时间") {
              tkey0 = parseFloat(season_data[i].data[j].value);
            }
            pro += "</td>";
            break;
          }
        }
        if (found == false) {
          pro += "<td>";
          pro += "--";
          pro += "</td>";
        }
        pros += pro;
      }
      pros += "</tr>";
      if (season_data[i].name == "所有英雄") {
        res += pros;
      } else {
        tmplists.push([tkey, tkey0, pros]);
      }
    }
    tmplists.sort(function(left, right) {
      return left[0] == right[0]
        ? (right[1] - left[1])
        : (right[0] - left[0]);
    });
    for (var i = 0; i < tmplists.length; ++i) {
      res += tmplists[i][2];
    }
    res += "</tbody>";
    res += "</table>";
    return res;
  },
  season_rank_charts: [],
  getSeasonRankChart: function(season_index) {
    if (!$("#season" + season_index + "-rank-chart").get(0)) {
      return;
    }
    $("#season" + season_index + "-rank-chart-title").on("click", function() {
      $("#season" + season_index + "-rank-chart").toggle();
    });
    var ctx = $("#season" + season_index + "-rank-chart").get(0).getContext('2d');
    var config = {
      type: 'bar',
      data: {
        datasets: [{
          type: 'line',
          backgroundColor: Chart.helpers.color("rgb(255, 99, 132)").alpha(0.5).rgbString(),
          borderColor: "rgb(255, 99, 132)",
          label: '竞技分数',
          fill: false,
          data: []
        },
        {
          type: 'line',
          backgroundColor: Chart.helpers.color("rgb(54, 162, 235)").alpha(0.5).rgbString(),
          borderColor: "rgb(54, 162, 235)",
          label: '生涯最高',
          fill: false,
          data: []
        }],
      },
      options: {
        responsive: true,
        legend: { display: 'left' },
        elements: {
          line: {
            tension: 0
          }
        },
        title: {
          display: true,
          text: '竞技分数',
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
            scaleLabel: { display: false }
          }]
        }
      }
    };
    var rank_history = this.data.player.rank_history[season_index];
    var rank_history_datasets = config.data.datasets;
    for (var i = 0; i < rank_history.length; ++i) {
      var date = new Date(rank_history[i].date);
      date.setHours(0, 0, 0);
      rank_history_datasets[0].data.push({x:date, y:rank_history[i].rank});
      rank_history_datasets[1].data.push({x:date, y:rank_history[i].highest_rank});
    }
    var rank_chart = new Chart(ctx, config);
    this.season_rank_charts[season_index] = rank_chart;
  },
  sortSeasonDetailData: function(season_index, sortkey) {
    var data_div = $("#season-data-table-" + season_index);
    var left = data_div.scrollLeft();
    data_div.html(this.getSeasonDetailData(season_index, sortkey));
    data_div.scrollLeft(left);
  },
  showSeasonDetailData: function(season_index, sortkey) {
    var res = "";
    res += "<div id=\"season-data-" + season_index + "\" style=\"display:none; overflow-y:auto;\">";
    if (this.data.player.rank[season_index] && this.data.player.rank[season_index].rank) {
      res += '<h3 id="season' + season_index + '-rank-chart-title">';
      res += '<span class="label label-rank" style="cursor:pointer">竞技分数 ' + this.data.player.rank[season_index].rank + '</span> ';
      res += '<span class="label label-rank" style="cursor:pointer">最高分数 ' + this.data.player.rank[season_index].highest_rank + '</span> ';
      res += '</h3>';
      res += '<canvas id="season' + season_index + '-rank-chart" style="display:none"></canvas>';
    }
    res += "<div id=\"season-data-table-" + season_index + "\">";
    res += this.getSeasonDetailData(season_index, sortkey);
    res += "</div>";
    res += "</div>";
    $("#season-data").html($("#season-data").html()+res);
    this.getSeasonRankChart(season_index);
  },
  showSeasonData: function() {
    this.season_rank_charts = [];
    var bar = $("#season-bar");
    bar.html("");
    this.cur_season = -1;
    $("#season-data").html("");
    for (var i = 0; i < this.data.seasons.length; ++i) {
      if (this.data.seasons[i] == null) {
        continue;
      }
      var season_title = i == 0 ? "快速游戏" : "第" + i + "赛季";
      bar.html(bar.html()+"<li class=\"\" role=\"presentation\" id=\"season-bar-" + i + "\" onclick=\"owrank_data.loadData(" + i + ");\"><a style=\"cursor:pointer\">" + season_title + "</a></li>");
      this.showSeasonDetailData(i,"游戏时间");
    }
    try {
      this.cur_season = 0;
      var season_bar = $("#season-bar-0");
      season_bar.addClass("active");
      var season_data = $("#season-data-0");
      season_data.show();
    } catch(e) {}
  },
  cur_category: -1,
  showModalBody: function(hero_data) {
    var category = this.category;
    var list_group = $("#modal-list-group");
    var tables = $("#modal-tables");
    list_group.html("");
    tables.html("");
    var boxes = [];
    for (var i = 0; i < category.length + 1; ++i) {
      boxes.push({});
    }
    var other_cnt = 0;
    for (var i = 0, len = hero_data.data.length; i < len; ++i) {
      var na = hero_data.data[i].name;
      var found = false;
      for (var j = 0; j < category.length; ++j) {
        var ind = category[j].indexOf(na);
        if (ind != -1) {
          boxes[j][ind] = hero_data.data[i];
          found = true;
        }
      }
      if (!found) {
        boxes[category.length][other_cnt] = hero_data.data[i];
        other_cnt += 1;
      }
    }
    this.cur_category = -1;
    for (var i = 0; i < category.length + 1; ++i) {
      if (Object.keys(boxes[i]).length != 0) {
        if (this.cur_category == -1) {
          this.cur_category = i;
        }
        list_group.html(list_group.html()+"<a onclick=\"owrank_data.changeHeroModalBody(" + i + ");\" style=\"cursor:pointer\" class=\"list-group-item\" id=\"modal-list-group-item-" + i + "\">" + this.category_title[i] + "</a>");
        tables.html(tables.html()+"<table class=\"table table-striped table-bordered\" id=\"modal-table-" + i + "\" style=\"display:none\"></table>");
      }
    }
    for (var i = 0; i < category.length + 1; ++i) {
      if (Object.keys(boxes[i]).length != 0) {
        var table = $("#modal-table-" + i);
        var res = "";
        res += "<tbody>";
        var keys = Object.keys(boxes[i]);
        keys.sort(function(left, right) {
          return parseInt(left) - parseInt(right);
        });
        for (var j = 0, len = keys.length; j < len; ++j) {
          var data = boxes[i][keys[j]];
          res += "<tr>";
          res += "<td><a onclick='owrank_data.showHeroHistoryChart(" + this.cur_season + ',"' + hero_data.name + '","' + data.name + '"' + ")'>" + data.name + "</a></td>";
          res += "<td>" + this.formatValue(data) + "</td>";
          res += "</tr>";
        }
        res += "</tbody>";
        table.html(res);
      }
    }
    $("#modal-list-group-item-" + this.cur_category).addClass("active");
    $("#modal-table-" + this.cur_category).toggle();
    this.showModalBodyHeroChart(this.data.player.name, this.cur_season, hero_data.name);
  },
  history_career: [],
  endor_level_history_chart_config: {
    type: 'bar',
    data: {
      datasets: [{
        type: 'line',
        backgroundColor: Chart.helpers.color("rgb(32, 40, 198)").alpha(0.5).rgbString(),
        borderColor: "rgb(32, 40, 198)",
        label: '赞赏等级',
        fill: false,
        data: []
      }],
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
        text: '等级',
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
          scaleLabel: { display: false }
        }]
      }
    }
  },
  level_history_chart_config: {
    type: 'bar',
    data: {
      datasets: [{
        type: 'line',
        backgroundColor: Chart.helpers.color("rgb(255, 205, 86)").alpha(0.5).rgbString(),
        borderColor: "rgb(255, 205, 86)",
        label: '等级',
        fill: false,
        data: []
      }],
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
        text: '等级',
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
          scaleLabel: { display: false }
        }]
      }
    }
  },
  endor_history_chart_config: {
    type: 'bar',
    data: {
      datasets: [{
        type: 'line',
        backgroundColor: Chart.helpers.color("rgb(49, 177, 49)").alpha(0.5).rgbString(),
        borderColor: "rgb(46, 177, 49)",
        label: '竞技风范',
        fill: false,
        data: []
      },
      {
        type: 'line',
        backgroundColor: Chart.helpers.color("rgb(189, 11, 234)").alpha(0.5).rgbString(),
        borderColor: "rgb(189, 11, 234)",
        label: '团队精神',
        fill: false,
        data: []
      },
      {
        type: 'line',
        backgroundColor: Chart.helpers.color("rgb(215, 129, 13)").alpha(0.5).rgbString(),
        borderColor: "rgb(215, 129, 13)",
        label: '出色指挥',
        fill: false,
        data: []
      },
      {
        type: 'line',
        backgroundColor: Chart.helpers.color("rgb(32, 40, 198)").alpha(0.5).rgbString(),
        borderColor: "rgb(32, 40, 198)",
        label: '赞赏数量',
        fill: false,
        data: []
      }]
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
        text: '赞赏',
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
          scaleLabel: { display: false }
        }]
      }
    }
  },
  hero_history_chart_config: {
    type: 'bar',
    data: {
      datasets: [{
        type: 'line',
        backgroundColor: Chart.helpers.color("rgb(255, 99, 132)").alpha(0.5).rgbString(),
        borderColor: "rgb(255, 99, 132)",
        label: 'data',
        fill: false,
        data: []
      }]
    },
    options: {
      responsive: true,
      legend: { display: false },
      elements: {
        line: {
          tension: 0
        }
      },
      title: { display: true, text: 'test', },
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
          scaleLabel: {
            display: false,
          }
        }]
      }
    }
  },
  showHeroHistoryChart: function(season, hero, chart_name) {
    $('#hero-modal').animate({scrollTop:0},"slow");
    $('#hero-history-chart-div').show();
    var history_hero_data = this.history_career[season][hero];
    var data;
    for (var i = 0; i < history_hero_data.length; ++i) {
      if (history_hero_data[i].name == chart_name) {
        data = history_hero_data[i];
        break;
      }
    }
    this.hero_history_chart_config.data.datasets[0].data = [];
    var chart_data = this.hero_history_chart_config.data.datasets[0].data;
    for (var i = 0; i < data.values.length; ++i) {
      var undata = {
        x: new Date(data.values[i].date),
        y: data.values[i].value
      };
      undata.x.setHours(0,0,0);
      chart_data.push(undata);
    }
    this.hero_history_chart_config.options.title.text = chart_name;
    this.hero_history_chart_config.options.scales.yAxes[0].ticks.callback = function(label, index, labels) {
      return owrank_data.formatValue({format: data.format, value: label});
    };
    this.hero_history_chart_config.options.tooltips.callbacks.label = function(tooltipItem, tooltipData) {
      return owrank_data.formatValue({format: data.format, value: tooltipItem.yLabel});
    };
    this.hero_history_chart.update();
  },
  showModalBodyHeroChart: function(battletag, season, hero) {
    $('#hero-history-chart-div').hide();
    $('#hero-history-chart-fail').hide();
    if (!this.history_career[season]) {
      this.history_career[season] = {};
    }
    if (this.history_career[season][hero]) {
      this.showHeroHistoryChart(season, hero, "游戏时间");
      return;
    }
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        try {
          var res = JSON.parse(this.responseText);
          owrank_data.history_career[season][hero] = res;
          owrank_data.showHeroHistoryChart(season, hero, "游戏时间");
        } catch (e) {
          $('#hero-history-chart-fail').show();
        }
      } else if (this.readyState == 4) {
        $('#hero-history-chart-fail').show();
      }
    }
    xhttp.open("POST", "/history_career", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("battletag=" + battletag + "&season=" + season + "&hero=" + hero);
  },
  changeHeroModalBody: function(item_id) {
    $("#modal-list-group-item-" + this.cur_category).removeClass("active");
    $("#modal-table-" + this.cur_category).toggle();
    this.cur_category = item_id;
    $("#modal-list-group-item-" + this.cur_category).addClass("active");
    $("#modal-table-" + this.cur_category).toggle();
  },
  showHeroModal: function(season_index, hero_index) {
    hero_data = this.data.seasons[season_index][hero_index];
    $("#hero-modal-title").html(hero_data.name);
    this.showModalBody(hero_data);
  },
  showData: function(data) {
    setCookie('battletag', data.player.name, 30);
    setCookie('no_update', 'true', null);
    this.history_career = [];
    this.data = data;
    this.showPlayerMessage();
    this.showSeasonData();
    $("#stats").show();
    $("#loading").hide();
    $("#failed").hide();
    $('#submit-button').prop('disabled', false);
  },
  showFailed: function() {
    $("#stats").hide();
    $("#loading").hide();;
    $("#failed").show();
    $('#submit-button').prop('disabled', false);
  },
  sendRequest: function(method) {
    $('#load-progress').width("0%");
    var cnt = 0;
    var interval = 100;
    var total_time = 30000 + 3000;
    var load_progress = setInterval(function() {
      cnt += 1;
      $('#load-progress').width(owrank_data.formatPercent(cnt * interval / total_time));
      if (cnt >= total_time / interval) {
        clearInterval(load_progress);
      }
    }, interval);
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        try {
          var res = JSON.parse(this.responseText);
          owrank_data.showData(res);
          clearInterval(load_progress);
        } catch (e) {
          owrank_data.showFailed();
          clearInterval(load_progress);
        }
      } else if (this.readyState == 4) {
        owrank_data.showFailed();
        clearInterval(load_progress);
      }
    }
    xhttp.open("POST", "/career", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    if (method == "cookie") {
      var cookie = $("#cookie").val();
      xhttp.send("cookie=" + cookie);
    } else if (method == "battletag") {
      var battletag = $("#battletag").val();
      var qst = "battletag=" + battletag;
      if (getCookie('no_update') === 'true') {
        qst += '&no_update=true';
      }
      xhttp.send(qst);
    } else if (method == "passwd") {
      var email = $("#email").val();
      var passwd = $("#passwd").val();
      xhttp.send("email=" + email + "&passwd=" + passwd);
    }
    $('html, body').animate({ scrollTop: 0 }, "slow");
    $('#submit-button').prop('disabled', true);
    $("#loading").show();
    $("#failed").hide();
  }, 
  category_title: [
    "游戏数据",
    "平均数据",
    "消灭",
    "命中率",
    "助攻",
    "伤害量",
    "治疗量",
    "生涯最佳",
    "生涯数据",
    "其它"
  ],
  category: [
    [
      "游戏时间",
      "比赛场次",
      "比赛胜利",
      "比赛战败",
      "获胜占比",
      "奖章",
      "杰出卡",
      "黄金奖章",
      "白银奖章",
      "青铜奖章"
    ],
    [
      "单次存活时消灭",
      "单次存活时伤害总量",
      "平均每10分钟消灭",
      "平均每10分钟伤害总量",
      "平均每10分钟对屏障伤害量",
      "平均每10分钟对英雄伤害量",
      "平均每10分钟技能伤害量",
      "平均每10分钟治疗量",
      "平均每10分钟自我治疗量",
      "平均每10分钟强化伤害",
      "平均每10分钟攻击助攻",
      "平均每10分钟防御助攻",
      "平均每10分钟阵亡",
      "平均每10分钟火力全开时间",
      "平均每10分钟暴击",
      "平均每10分钟目标攻防消灭",
      "平均每10分钟目标攻防时间",
      "平均每10分钟最后一击",
      "平均每10分钟阻挡伤害量",
      "平均每10分钟近身消灭",
      "平均每10分钟辅助攻击直接命中",
      "平均能量",
      "鼓舞士气持续时间占比",
      "平均传送面板存在时间",
      "平均每10分钟“岚”消灭",
      "平均每10分钟“散”消灭",
      "平均每10分钟“斩”消灭",
      "平均每10分钟传送玩家",
      "平均每10分钟使用投射屏障",
      "平均每10分钟使用纳米激素",
      "平均每10分钟侦查模式消灭",
      "平均每10分钟侦测助攻",
      "平均每10分钟侵入敌人",
      "平均每10分钟催眠敌人",
      "平均每10分钟冰冻敌人",
      "平均每10分钟冲击枪消灭",
      "平均每10分钟冲锋消灭",
      "平均每10分钟击退玩家",
      "平均每10分钟制造护甲包",
      "平均每10分钟剧毒诡雷消灭",
      "平均每10分钟单独消灭",
      "平均每10分钟原始暴怒消灭",
      "平均每10分钟反弹伤害量",
      "平均每10分钟呼叫机甲",
      "平均每10分钟哨卫模式消灭",
      "平均每10分钟哨戒炮消灭",
      "平均每10分钟喷射背包消灭",
      "平均每10分钟困住敌人",
      "平均每10分钟坦克模式消灭",
      "平均每10分钟复活玩家",
      "平均每10分钟开镜暴击",
      "平均每10分钟恢复生命值",
      "平均每10分钟战术目镜消灭",
      "平均每10分钟托比昂消灭",
      "平均每10分钟护甲提供",
      "平均每10分钟提供音障",
      "平均每10分钟暴雪消灭",
      "平均每10分钟死亡绽放消灭",
      "平均每10分钟毁天灭地消灭",
      "平均每10分钟火箭弹幕消灭",
      "平均每10分钟火箭直接命中",
      "平均每10分钟炮台消灭",
      "平均每10分钟炸弹轮胎消灭",
      "平均每10分钟烈焰打击消灭",
      "平均每10分钟熔火核心消灭",
      "平均每10分钟生成护盾",
      "平均每10分钟电磁脉冲击中敌人",
      "平均每10分钟神射手消灭",
      "平均每10分钟纳米激素助攻",
      "平均每10分钟聚合射线治疗量",
      "平均每10分钟聚合射线消灭",
      "平均每10分钟脉冲炸弹命中",
      "平均每10分钟脉冲炸弹消灭",
      "平均每10分钟自毁消灭",
      "平均每10分钟螺旋飞弹消灭",
      "平均每10分钟裂地猛击消灭",
      "平均每10分钟超充能器助攻",
      "平均每10分钟近身最后一击",
      "平均每10分钟连射消灭",
      "平均每10分钟重力喷涌消灭",
      "平均每10分钟钩中敌人",
      "平均每10分钟震荡地雷消灭",
      "平均每10分钟高能消灭",
      "平均每10分钟鸡飞狗跳消灭"
    ],
    [
      "单次存活时消灭",
      "平均每10分钟消灭",
      "平均每10分钟目标攻防消灭",
      "平均每10分钟单独消灭",
      "平均每10分钟最后一击",
      "平均每10分钟近身消灭",
      "单场最多消灭",
      "单次存活时最多消灭",
      "最佳瞬间消灭",
      "最佳连续消灭",
      "平均每10分钟震荡地雷消灭",
      "平均每10分钟高能消灭",
      "平均每10分钟鸡飞狗跳消灭",
      "平均每10分钟连射消灭",
      "平均每10分钟重力喷涌消灭",
      "平均每10分钟自毁消灭",
      "平均每10分钟螺旋飞弹消灭",
      "平均每10分钟裂地猛击消灭",
      "平均每10分钟脉冲炸弹消灭",
      "平均每10分钟聚合射线消灭",
      "平均每10分钟神射手消灭",
      "平均每10分钟炮台消灭",
      "平均每10分钟炸弹轮胎消灭",
      "平均每10分钟烈焰打击消灭",
      "平均每10分钟熔火核心消灭",
      "平均每10分钟火箭弹幕消灭",
      "平均每10分钟死亡绽放消灭",
      "平均每10分钟毁天灭地消灭",
      "平均每10分钟暴雪消灭",
      "平均每10分钟战术目镜消灭",
      "平均每10分钟托比昂消灭",
      "平均每10分钟坦克模式消灭",
      "平均每10分钟喷射背包消灭",
      "平均每10分钟哨戒炮消灭",
      "平均每10分钟哨卫模式消灭",
      "平均每10分钟原始暴怒消灭",
      "平均每10分钟剧毒诡雷消灭",
      "平均每10分钟冲击枪消灭",
      "平均每10分钟冲锋消灭",
      "平均每10分钟侦查模式消灭",
      "平均每10分钟“岚”消灭",
      "平均每10分钟“散”消灭",
      "平均每10分钟“斩”消灭",
      "单场最多目标攻防消灭",
      "单场最多最后一击",
      "单场最多冲击枪消灭",
      "单场最多冲锋消灭",
      "单场最多剧毒诡雷消灭",
      "单场最多单独消灭",
      "单场最多原始暴怒消灭",
      "单场最多哨卫模式消灭",
      "单场最多哨戒炮消灭",
      "单场最多喷射背包消灭",
      "单场最多地形消灭",
      "单场最多坦克模式消灭",
      "单场最多暴雪消灭",
      "单场最多死亡绽放消灭",
      "单场最多毁天灭地消灭",
      "单场最多炮台消灭",
      "单场最多炸弹轮胎消灭",
      "单场最多烈焰打击消灭",
      "单场最多熔火核心消灭",
      "单场最多神射手消灭",
      "单场最多聚合射线消灭",
      "单场最多脉冲炸弹消灭",
      "单场最多自毁消灭",
      "单场最多螺旋飞弹消灭",
      "单场最多裂地猛击消灭",
      "单场最多近身最后一击",
      "单场最多近身消灭",
      "单场最多连射消灭",
      "单场最多重力喷涌消灭",
      "单场最多震荡地雷消灭",
      "单场最多高能消灭",
      "单场最多鸡飞狗跳消灭",
      "消灭",
      "瞬间消灭",
      "单独消灭",
      "目标攻防消灭",
      "地形消灭",
      "武器消灭",
      "最后一击",
      "近身消灭",
      "近身最后一击",
      "冲击枪消灭",
      "冲锋消灭",
      "“散”消灭",
      "“斩”消灭",
      "“竜”消灭",
      "”岚“ 消灭",
      "侦察模式消灭",
      "剧毒诡雷消灭",
      "原始暴怒消灭",
      "哨卫模式消灭",
      "哨戒炮消灭",
      "喷射背包消灭",
      "坦克模式消灭",
      "弹幕消灭",
      "战术目镜消灭",
      "托比昂消灭",
      "护甲提供",
      "暴雪消灭",
      "死亡绽放消灭",
      "毁天灭地消灭",
      "炮台消灭",
      "炸弹轮胎消灭",
      "烈焰打击消灭",
      "熔火核心消灭",
      "生物手雷消灭",
      "神射手消灭",
      "聚合射线消灭",
      "脉冲炸弹命中",
      "脉冲炸弹消灭",
      "自毁消灭",
      "螺旋飞弹消灭",
      "裂地猛击消灭",
      "跳跃消灭",
      "连射消灭",
      "重力喷涌消灭",
      "震荡地雷消灭",
      "高能消灭",
      "鸡飞狗跳消灭"
    ],
    [
      "主要攻击模式命中率",
      "特斯拉炮命中率",
      "火箭重锤近身攻击命中率",
      "辅助攻击命中率",
      "近身攻击命中率",
      "链钩命中率",
      "武器命中率",
      "原始暴怒近身攻击命中率",
      "暴击命中率",
      "开镜命中率",
      "开镜暴击率",
      "不开镜命中率",
      "单场最佳不开镜命中率",
      "单场最佳开镜命中率",
      "单场最多暴击",
      "单场最多开镜暴击",
      "单场最佳武器命中率",
      "单场最佳链钩命中率"
    ],
    [
      "平均每10分钟防御助攻",
      "平均每10分钟侦测助攻",
      "平均每10分钟攻击助攻",
      "平均每10分钟纳米激素助攻",
      "平均每10分钟超充能器助攻",
      "单场最多攻击助攻",
      "单场最多防御助攻",
      "单场最多纳米激素助攻",
      "单场最多超充能器助攻",
      "攻击助攻",
      "防御助攻",
      "纳米激素助攻",
      "超充能器助攻"
    ],
    [
      "单次存活时伤害总量",
      "平均每10分钟对屏障伤害量",
      "平均每10分钟对英雄伤害量",
      "平均每10分钟技能伤害量",
      "平均每10分钟阻挡伤害量",
      "平均每10分钟反弹伤害量",
      "单次存活最多对英雄伤害量",
      "单场最多对屏障伤害量",
      "单场最多对英雄伤害量",
      "单场最多反弹伤害量",
      "单场最多强化伤害",
      "单场最多技能伤害量",
      "伤害总量",
      "伤害量",
      "对屏障伤害量",
      "对英雄伤害量",
      "技能伤害量",
      "强化伤害"
    ],
    [
      "单场最多恢复生命值",
      "单场最多自我治疗量",
      "单场最多治疗量",
      "单场最多聚合射线治疗量",
      "最佳“圣”治疗量",
      "单场最多制造护甲包",
      "单场最多护甲提供",
      "恢复生命值",
      "自我治疗量",
      "护甲提供",
      "生成护盾",
      "生物力场治疗量",
      "聚合射线治疗量",
    ],
    [
      "单次存活时最多暴击",
      "单次存活时最多消灭",
      "单次存活最多对英雄伤害量",
      "最佳瞬间消灭",
      "最佳连续消灭",
      "最佳“圣”治疗量",
      "单场伤害总量",
      "单场最多消灭",
      "单场最多对屏障伤害量",
      "单场最多对英雄伤害量",
      "单场最多技能伤害量",
      "单场最多治疗量",
      "单场最多自我治疗量",
      "单场最多聚合射线治疗量",
      "单场最多攻击助攻",
      "单场最多防御助攻",
      "单场最多暴击",
      "单场最多最后一击",
      "单场最多阻挡伤害量",
      "单场最佳不开镜命中率",
      "单场最佳开镜命中率",
      "单场最佳武器命中率",
      "单场最佳链钩命中率",
      "单场最长火力全开时间",
      "单场最长目标攻防时间",
      "单场最多目标攻防消灭",
      "单场最多神射手消灭",
      "单场最多提供音障",
      "单场最多“岚”消灭",
      "单场最多“散”消灭",
      "单场最多“斩”消灭",
      "单场最多“竜”消灭",
      "单场最多冲锋消灭",
      "单场最多剧毒诡雷消灭",
      "单场最多单独消灭",
      "单场最多原始暴怒消灭",
      "单场最多侦察模式消灭",
      "单场最多冲击枪消灭",
      "单场最多哨卫模式消灭",
      "单场最多哨戒炮消灭",
      "单场最多喷射背包消灭",
      "单场最多地形消灭",
      "单场最多坦克模式消灭",
      "单场最多战术目镜消灭",
      "单场最多托比昂消灭",
      "单场最多暴雪消灭",
      "单场最多死亡绽放消灭",
      "单场最多毁天灭地消灭",
      "单场最多炮台消灭",
      "单场最多炸弹轮胎消灭",
      "单场最多烈焰打击消灭",
      "单场最多熔火核心消灭",
      "单场最多聚合射线消灭",
      "单场最多脉冲炸弹消灭",
      "单场最多自毁消灭",
      "单场最多螺旋飞弹消灭",
      "单场最多裂地猛击消灭",
      "单场最多近身最后一击",
      "单场最多近身消灭",
      "单场最多连射消灭",
      "单场最多重力喷涌消灭",
      "单场最多震荡地雷消灭",
      "单场最多高能消灭",
      "单场最多鸡飞狗跳消灭",
      "单场最多纳米激素助攻",
      "单场最多超充能器助攻",
      "单场最多传送玩家",
      "单场最多使用投射屏障",
      "单场最多使用纳米激素",
      "单场最多侦测助攻",
      "单场最多侵入敌人",
      "单场最多冰冻敌人",
      "单场最多击退玩家",
      "单场最多制造护甲包",
      "单场最多反弹伤害量",
      "单场最多呼叫机甲",
      "单场最多困住敌人",
      "单场最多复活玩家",
      "单场最多开镜暴击",
      "单场最多弹幕消灭",
      "单场最多强化伤害",
      "单场最多恢复生命值",
      "单场最多护甲提供",
      "单场最多摧毁传送面板",
      "单场最多摧毁护盾发生器",
      "单场最多摧毁炮台",
      "单场最多火箭直接命中",
      "单场最多生成护盾",
      "单场最多电磁脉冲击中敌人",
      "单场最多脉冲炸弹命中",
      "单场最多钩中敌人",
      "单场最多麻醉敌人",
      "单场最长传送面板存在时间",
      "单场最高平均能量"
    ],
    [
      "游戏时间",
      "伤害总量",
      "伤害量",
      "对屏障伤害量",
      "对英雄伤害量",
      "治疗量",
      "自我治疗量",
      "“圣”治疗量",
      "复活玩家",
      "消灭",
      "阵亡",
      "瞬间消灭",
      "目标攻防消灭",
      "单独消灭",
      "地形消灭",
      "武器消灭",
      "最后一击",
      "攻击助攻",
      "火力全开时间",
      "目标攻防时间",
      "近身消灭",
      "近身最后一击",
      "阻挡伤害量",
      "“散”消灭",
      "“斩”消灭",
      "“竜”消灭",
      "”岚“ 消灭",
      "传送玩家",
      "传送面板存在时间",
      "使用投射屏障",
      "使用生物力场",
      "使用纳米激素",
      "侦察模式消灭",
      "侦测助攻",
      "侵入敌人",
      "冰冻敌人",
      "冲击枪消灭",
      "冲锋消灭",
      "击退玩家",
      "制造护甲包",
      "剧毒诡雷消灭",
      "原始暴怒消灭",
      "反弹伤害量",
      "呼叫机甲",
      "哨卫模式消灭",
      "哨戒炮消灭",
      "喷射背包消灭",
      "困住敌人",
      "坦克模式消灭",
      "开镜暴击",
      "弹幕消灭",
      "强化伤害",
      "恢复生命值",
      "战术目镜消灭",
      "扔出链钩",
      "托比昂消灭",
      "技能伤害量",
      "护盾发生器存在时间",
      "摧毁传送面板",
      "摧毁护盾发生器",
      "摧毁炮台",
      "暴击",
      "暴雪消灭",
      "机甲被敌方摧毁",
      "死亡绽放消灭",
      "毁天灭地消灭",
      "火箭直接命中",
      "炮台消灭",
      "炸弹轮胎消灭",
      "烈焰打击消灭",
      "熔火核心消灭",
      "生成护盾",
      "生物力场治疗量",
      "生物手雷消灭",
      "电磁脉冲击中敌人",
      "神射手消灭",
      "纳米激素助攻",
      "聚合射线治疗量",
      "聚合射线消灭",
      "自毁消灭",
      "螺旋飞弹消灭",
      "裂地猛击消灭",
      "超充能器助攻",
      "跳跃消灭",
      "连射消灭",
      "重力喷涌消灭",
      "钩中敌人",
      "震荡地雷消灭",
      "高能消灭",
      "鸡飞狗跳消灭",
      "麻醉敌人",
      "提供音障"
    ]
  ]
};
{
  var ctx = $("#endor-chart").get(0).getContext('2d');
  owrank_data.doughnut = new Chart(ctx, owrank_data.doughnut_config);
}
{
  var ctx = $("#endor-history-chart").get(0).getContext('2d');
  owrank_data.endor_history_chart = new Chart(ctx, owrank_data.endor_history_chart_config);
}
{
  var ctx = $("#level-history-chart").get(0).getContext('2d');
  owrank_data.level_history_chart = new Chart(ctx, owrank_data.level_history_chart_config);
}
{
  var ctx = $("#endor-level-history-chart").get(0).getContext('2d');
  owrank_data.endor_level_history_chart = new Chart(ctx, owrank_data.endor_level_history_chart_config);
}
{
  var ctx = $("#hero-history-chart").get(0).getContext('2d');
  owrank_data.hero_history_chart = new Chart(ctx, owrank_data.hero_history_chart_config);
}
$(document).ready(function() {
  if (getCookie('battletag')) {
    var battletag = getCookie('battletag');
    $('#battletag-a').click();
    $('#battletag').val(battletag);
    $('#submit-button').click();
  }
});
