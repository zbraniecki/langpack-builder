var Promise = require('promise');
var fs = require('fs');
var path = require('path');
var utils = require('../utils');

function LangpackBuilder(config) {
  this.config = config;

}

LangpackBuilder.tasks = {
  'manifest': require('./tasks/manifest').Task,
  'copy': require('./tasks/copy').Task,
  'optimize': require('./tasks/optimize').Task
};

LangpackBuilder.prototype.init = function() {
  return utils.getAppDirs(this.config).then(function(appDirs) {
    this.config.GAIA_APPS = appDirs;
  }.bind(this));
}

LangpackBuilder.prototype.setupStage = function() {
  utils.cleanDir(this.config.LP_RESULT_DIR);

}

LangpackBuilder.prototype.build = function() {
  this.setupStage();
  var apps = this.config.GAIA_APPS;
  //var apps = ['apps/settings'];
  LangpackBuilder.tasks.manifest(this);

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
          tasks.push(
            LangpackBuilder.tasks.copy(this, locale, apps[appName], resList));
          tasks.push(
            LangpackBuilder.tasks.optimize(this, locale, apps[appName], resList));
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
