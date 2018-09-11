exports.getSqlDate = function (date) {
  var year = date.getFullYear().toString();
  var month = (date.getMonth() + 1).toString();
  var date = date.getDate().toString();
  month = (month.length == 1) ? '0' + month : month;
  date = (date.length == 1) ? '0' + date : date;
  return year + '-' + month + '-' + date;
}

exports.cutBattletag = function (st) {
  var pos = st.lastIndexOf('#');
  return st.substr(0, pos);
};
exports.notEmpty = function (st) {
  return st && st != "";
};

