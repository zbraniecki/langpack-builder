var fs = require('fs');
var Promise = require('promise');
var path = require('path');
var utils = require('../../utils');

var BuildAppManifests = function(lpBuilder, locale, app, resList) {
  var resultPath = path.join(lpBuilder.config.LP_RESULT_DIR, locale);
  var manifestPath = path.join(
    lpBuilder.config.LOCALE_BASEDIR, app, 'manifest.properties');

  if (fs.existsSync(manifestPath)) {
    utils.copyFile(manifestPath,
      path.join(resultPath, app, 'manifest.properties'));
  }

  return Promise.resolve();
};

exports.Task = BuildAppManifests;
