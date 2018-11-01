var tmp_path = '/tmp/';

const fs = require('fs');
const path = require('path');

exports.tmp_path = tmp_path;
function mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : '';
  const baseDir = isRelativeToScript ? __dirname : '.';

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === 'EEXIST') { // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
      if (!caughtErr || caughtErr && targetDir === curDir) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, initDir);
}
mkDirByPathSync(tmp_path);

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

exports.getRank = function (rank) {
  if (rank < 1500) return 0;
  if (rank < 2000) return 1;
  if (rank < 2500) return 2;
  if (rank < 3000) return 3;
  if (rank < 3500) return 4;
  if (rank < 4000) return 5;
  return 6;
}

exports.rankNames = ["青铜","白银","黄金","铂金","钻石","大师","宗师"];
