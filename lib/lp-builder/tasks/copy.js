var fs = require('fs');
var Promise = require('promise');
var path = require('path');
var utils = require('../../utils');
var lpUtils = require('../utils');

var CopyAppData = function(lpBuilder, locale, app, resList) {
  var resultPath = path.join(lpBuilder.config.LP_RESULT_DIR, locale);

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

  var manifestPath = path.join(lpBuilder.config.LOCALE_BASEDIR, app, 'manifest.properties');

  if (fs.existsSync(manifestPath)) {
    utils.copyFile(manifestPath,
      path.join(resultPath, app, 'manifest.properties'));
  }
  return Promise.resolve();
}

exports.Task = CopyAppData;

