var utils = require('../../utils');
var fs = require('fs');
var path = require('path');
var l10nOptimizer = require('../../l10noptimize');

var buildOptimizedAST = function(lpBuilder, locale, appPath, resList) {
  return l10nOptimizer.buildASTFromContext(
    lpBuilder.config.GAIA_DIR, lpBuilder.config.LOCALE_BASEDIR, resList).then(function(ast) {
    var source = JSON.stringify(ast);
    if (!utils.fileExists(path.join(lpBuilder.config.LP_RESULT_DIR, locale, appPath))) {
      fs.mkdirSync(path.join(lpBuilder.config.LP_RESULT_DIR, locale, appPath));
    }
    fs.mkdirSync(path.join(lpBuilder.config.LP_RESULT_DIR, locale, appPath, 'locales-obj'));
    utils.writeFile(path.join(lpBuilder.config.LP_RESULT_DIR, locale, appPath, 'locales-obj', locale + '.json'), source);
  });
}

exports.Task = buildOptimizedAST;
