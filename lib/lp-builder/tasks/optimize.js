var Promise = require('promise');
var fs = require('fs');
var path = require('path');
var utils = require('../../utils');
var l10nOptimizer = require('../../l10noptimize');

function getL10nJSONFileName(locale, htmlPath, fullAppPath) {
  var relativePath = path.relative(fullAppPath, htmlPath);
  var base = relativePath.replace('.html', '').replace(/\//g, '.');
  return base + '.' + locale + '.json';
}

function writeAST(lpBuilder, locale, appPath, astTuple) {
  var source = JSON.stringify(astTuple[1]);

  var name = getL10nJSONFileName(
    locale,
    astTuple[0],
    path.join(lpBuilder.config.GAIA_DIR, appPath));

  var appDir = path.join(lpBuilder.config.LP_RESULT_DIR, locale, appPath);
  if (!utils.fileExists(appDir)) {
    fs.mkdirSync(appDir);
  }

  var localesObj = path.join(appDir, 'locales-obj');
  if (!utils.fileExists(localesObj)) {
    fs.mkdirSync(localesObj);
  }
  utils.writeFile(path.join(appDir, 'locales-obj', name), source);
}

function process(lpBuilder, locale, appPath, resTuple) {
  var buildAST = l10nOptimizer.buildASTFromContext.bind(
    null, lpBuilder.config.GAIA_DIR, lpBuilder.config.LOCALE_BASEDIR);

  return buildAST(resTuple).then(
    writeAST.bind(null, lpBuilder, locale, appPath));
}

function buildOptimizedAST(lpBuilder, locale, appPath, resTuples) {
  var buildAST = l10nOptimizer.buildASTFromContext.bind(
   null, lpBuilder.config.GAIA_DIR, lpBuilder.config.LOCALE_BASEDIR);

  return Promise.all(
    resTuples.map(
      process.bind(null, lpBuilder, locale, appPath)));
}

exports.Task = buildOptimizedAST;
