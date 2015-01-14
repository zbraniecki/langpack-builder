var utils = require('../../utils');
var fs = require('fs');
var path = require('path');
var l10nOptimizer = require('../../l10noptimize');

var buildOptimizedAST = function(lpBuilder, locale, appPath, resList) {
  return l10nOptimizer.buildASTFromContext(
    lpBuilder.config.GAIA_DIR, lpBuilder.config.LOCALE_BASEDIR, resList).then(function(ast) {
    var source = JSON.stringify(ast);

    var appDir = path.join(lpBuilder.config.LP_RESULT_DIR, locale, appPath);
    if (!utils.fileExists(appDir)) {
      fs.mkdirSync(appDir);
    }
    fs.mkdirSync(path.join(appDir, 'locales-obj'));
    utils.writeFile(path.join(appDir, 'locales-obj', locale + '.json'), source);
  });
}

exports.Task = buildOptimizedAST;
