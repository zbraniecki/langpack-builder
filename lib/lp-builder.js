var Promise = require('promise');
var fs = require('fs');
var path = require('path');

var utils = require('./utils');
var l10nOptimizer = require('./l10noptimize');


function LangpackBuilder(config) {
  this.config = config;

}

LangpackBuilder.prototype.init = function() {
  return utils.getAppDirs(this.config).then(function(appDirs) {
    this.config.GAIA_APPS = appDirs;
  }.bind(this));
}

LangpackBuilder.prototype.setupStage = function() {
  utils.cleanDir(this.config.LP_RESULT_DIR);

}

LangpackBuilder.prototype.addLangpackManifest = function() {
  var manifest = {};

  manifest.name = this.config.LP_NAME;
  manifest.role = 'langpack';
  manifest.version = '1.0.0';
  manifest.developer = {
    'name': 'Mozilla',
    'url': this.config.LP_RELEASE_URL
  };
  manifest['languages-target'] = {
    'app://*.gaiamobile.org/manifest.webapp': '2.2'
  };
  manifest['languages-provided'] = {};

  this.config.LOCALES.forEach(function(locale) {
    var origins = {};
    for (var name in this.config.GAIA_APPS) {
      // what about marketplace.firefox.com?
      var appID = 'app://' + name + '.gaiamobile.org/manifest.webapp';
      origins[appID] = '/' + locale + '/apps/' + name;
    }
    manifest['languages-provided'][locale] = {
      version: parseInt(utils.getTimestamp()),
      apps: origins
    };
  }.bind(this));
  var manifestPath = path.join(this.config.LP_RESULT_DIR, 'manifest.webapp');
  utils.writeFile(manifestPath, JSON.stringify(manifest, false, 2));
}

LangpackBuilder.prototype.build = function() {
  this.setupStage();
  var apps = this.config.GAIA_APPS;
  //var apps = ['apps/settings'];
  this.addLangpackManifest();

  var locale = this.config.LOCALES[0];
  fs.mkdirSync(path.join(this.config.LP_RESULT_DIR, locale));
  fs.mkdirSync(path.join(this.config.LP_RESULT_DIR, locale, 'apps'));

  var tasks = [];
  var appsProcessing = [];

  Object.keys(apps).forEach(function(appName) {
    appsProcessing.push(utils.getResourcesFromHTMLFiles(this.config.GAIA_DIR,
      path.join(this.config.GAIA_DIR, apps[appName]))
      .then(function(resList) {
        if (resList.size) {
          exports.copyAppData(
            this.config.LOCALE_BASEDIR,
            this.config.LP_RESULT_DIR,
            locale,
            apps[appName],
            resList);
          tasks.push(exports.buildOptimizedAST(
            this.config.GAIA_DIR,
            this.config.LOCALE_BASEDIR,
            this.config.LP_RESULT_DIR,
            locale,
            apps[appName],
            resList));
        }
      }.bind(this)));
  }, this);

  Promise.all(appsProcessing).then(function() {
    Promise.all(tasks).then(function() {
      console.log('--- complete');
    });
  });
}

exports.LangpackBuilder = LangpackBuilder;





exports.copyAppData = function(localePath, resultPath, locale, app, resList) {
  var resultPath = path.join(resultPath, locale);
  var sourceAppPath = path.join(localePath, app);
  var resultAppPath = path.join(resultPath, app, 'locales'); 

  resList.forEach(function(resPath) {
    var pathChunks = utils.splitPath(resPath);

    if (pathChunks[0] === 'shared') {
      pathChunks = pathChunks.filter(function(chunk) {
        return chunk !== 'locales';
      });
      var newPath = path.join.apply(path, pathChunks);
      var inPath = path.join(localePath, newPath.replace('.{locale}.', '.'));
      var outPath = path.join(resultPath, app, newPath.replace('.{locale}.', '.' + locale + '.'));

      if (!fs.existsSync(inPath)) {
        console.warn('Warning! Missing file: ' + inPath + ', needed by app: ' + app);
        return;
      }
      utils.copyFile(inPath, outPath);
    } else {
      pathChunks = pathChunks.filter(function(chunk) {
        return chunk !== 'locales';
      });
      var newPath = path.relative(app, path.join.apply(path, pathChunks));
      var inPath = path.join(sourceAppPath, newPath.replace('.{locale}.', '.'));
      var outPath = path.join(resultPath, app, 'locales', newPath.replace('.{locale}.', '.' + locale + '.'));
      
      if (!fs.existsSync(inPath)) {
        console.warn('Warning! Missing file: ' + inPath + ', needed by app: ' + app);
        return;
      }
      utils.copyFile(inPath, outPath);
    }
  });

  var manifestPath = path.join(sourceAppPath, 'manifest.properties');

  if (fs.existsSync(manifestPath)) {
    utils.copyFile(manifestPath,
      path.join(resultPath, app, 'manifest.properties'));
  }
}

exports.buildOptimizedAST = function(gaiaPath, localePath, resultPath, locale, appPath, resList) {
  return l10nOptimizer.buildASTFromContext(gaiaPath, localePath, resList).then(function(ast) {
    var source = JSON.stringify(ast);
    if (!utils.fileExists(path.join(resultPath, locale, appPath))) {
      fs.mkdirSync(path.join(resultPath, locale, appPath));
    }
    fs.mkdirSync(path.join(resultPath, locale, appPath, 'locales-obj'));
    utils.writeFile(path.join(resultPath, locale, appPath, 'locales-obj', locale + '.json'), source);
  });
}

