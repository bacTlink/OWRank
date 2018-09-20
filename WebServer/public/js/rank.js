var table = {};
table['endor-chn'] = ["战网昵称", "赞赏等级", "赞赏总数", "竞技精神", "团队贡献", "出色指挥"];
table['endor'] = ['name', 'level', 'total', 'sportsmanship', 'teammate', 'shotcaller'];
table['rank-chn'] = ["战网昵称", "竞技等级", "生涯最高"];
table['rank'] = ['name', 'rank', 'highest_rank'];
function getTitle(key) {
  if (key == 'endor') {
    return "赞赏";
  }
  if (key.substr(0, 4) == 'rank') {
    return "第" + key.substr(4) + "赛季";
  }
  return '??';
}
var table_names;
function getRankTables() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      try {
        var res = JSON.parse(this.responseText);
        var rank_bar_html = "";
        var tables_html = "";
        var first = true;
        table_names = [];
        for (var key0 in res) {
          if (!res.hasOwnProperty(key0)) {
            continue;
          }
          table_names.push(key0);
          rank_bar_html += "<li" + (first ? " class=\"active\"" : "") + " role=\"presentation\" id=\"bar-" + key0 + "\" onclick=\"switchTable('" + key0 + "');\"><a style=\"cursor:pointer\">" + getTitle(key0) + "</a></li>";
          var table_div = "<div id=\"table-" + key0 + "\" style=\"overflow-y: auto;" + (first ? "" : "display:none;") + "\">";
          var rec = res[key0];
          var key = key0;
          while (!table[key]) {
            key = key.substr(0, key.length - 1);
          }
          var table_content = "<table class=\"table table-striped table-responsive text-nowrap\">";
          var thead = "<thead>";
          thead += "<tr>";
          for (var i = 0; i < table[key+'-chn'].length; ++i) {
            thead += "<th>";
            thead += table[key+'-chn'][i];
            thead += "</th>";
          }
          thead += "</tr>";
          thead += "</thead>";
          table_content += thead;
          var tbody = "<tbody>";
          for (var i = 0; i < rec.length; ++i) {
            tbody += "<tr>";
            for (var j = 0; j < table[key].length; ++j) {
              tbody += "<td>";
              tbody += rec[i][table[key][j]];
              tbody += "</td>";
            }
            tbody += "</tr>";
          }
          tbody += "</tbody>";
          table_content += tbody;
          table_content += "</table>";
          table_div += table_content;
          table_div += "</div>";
          tables_html += table_div;
          first = false;
        }
        $('#rank-bar').html(rank_bar_html);
        $('#tables').html(tables_html);
      } catch (e) {}
    }
  }
  xhttp.open("POST", "rank", true);
  xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  xhttp.send("content=endor");
}
function switchTable(key) {
  for (var i = 0; i < table_names.length; ++i) {
    $('#table-' + table_names[i]).hide();
    $('#bar-' + table_names[i]).removeClass('active');
  }
  $('#table-' + key).show();
  $('#bar-' + key).addClass('active');
}
$(document).ready(function() {
  getRankTables();
});
