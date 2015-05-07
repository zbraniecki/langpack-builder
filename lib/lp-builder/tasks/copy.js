var fs = require('fs');
var Promise = require('promise');
var Set = require('es6-set');
var path = require('path');
var lpUtils = require('../utils');
var utils = require('../../utils');

function flattenResources(gaiaPath, resTuples) {
  var flatResources = new Set();
  resTuples.forEach(function(tuple) {
    var resList = tuple[1];
    resList.forEach(function(resPath) {
      flatResources.add(resPath);
    });
  });

  return flatResources;
}

var CopyAppData = function(lpBuilder, locale, app, resTuples) {
  var resultPath = path.join(lpBuilder.config.LP_RESULT_DIR, locale);

  var resList = flattenResources(lpBuilder.config.GAIA_DIR, resTuples);
  resList.forEach(function(resPath) {
    var fullPath, outPath;
    if (utils.isSubjectToBranding(resPath)) {
      fullPath = utils.getSourcePathFromURI(lpBuilder.config.GAIA_DIR, resPath);
    } else {
      fullPath = utils.getLocalePathFromURI(lpBuilder.config.LOCALE_BASEDIR, resPath);
    }

    var pathChunks = utils.splitPath(resPath);
    if (pathChunks[0] === 'shared') {
      outPath = path.join(resultPath, app, resPath.replace('.{locale}.', '.' + locale + '.'));
    } else {
      outPath = path.join(resultPath, resPath.replace('.{locale}.', '.' + locale + '.'));
    }

    if (!fs.existsSync(fullPath)) {
      console.warn('Warning! Missing file: ' + fullPath + ', needed by app: ' + app);
      return;
    }
    utils.copyFile(fullPath, outPath);
  });
  return Promise.resolve();
}

exports.Task = CopyAppData;

