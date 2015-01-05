
var path = require('path');
var utils = require('../../utils');

var addLangpackManifest = function(lpBuilder) {
  var manifest = {};

  manifest.name = lpBuilder.config.LP_NAME;
  manifest.role = 'langpack';
  manifest.version = '1.0.0';
  manifest.developer = {
    'name': 'Mozilla',
    'url': lpBuilder.config.LP_RELEASE_URL
  };
  manifest['languages-target'] = {
    'app://*.gaiamobile.org/manifest.webapp': '2.2'
  };
  manifest['languages-provided'] = {};

  lpBuilder.config.LOCALES.forEach(function(locale) {
    var origins = {};
    for (var name in lpBuilder.config.GAIA_APPS) {
      // what about marketplace.firefox.com?
      var appID = 'app://' + name + '.gaiamobile.org/manifest.webapp';
      origins[appID] = '/' + locale + '/apps/' + name;
    }
    manifest['languages-provided'][locale] = {
      version: parseInt(utils.getTimestamp()),
      apps: origins
    };
  });
  var manifestPath = path.join(lpBuilder.config.LP_RESULT_DIR, 'manifest.webapp');
  utils.writeFile(manifestPath, JSON.stringify(manifest, false, 2));
}

exports.Task = addLangpackManifest;
