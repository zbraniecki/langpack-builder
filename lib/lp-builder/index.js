var Promise = require('promise');
var fs = require('fs');
var path = require('path');
var lpUtils = require('./utils');
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
  return lpUtils.getAppDirs(this.config).then(function(appDirs) {
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

  var locale = this.config.LOCALES[0];
  fs.mkdirSync(path.join(this.config.LP_RESULT_DIR, locale));
  fs.mkdirSync(path.join(this.config.LP_RESULT_DIR, locale, 'apps'));

  var tasks = [];
  var appsProcessing = [];

  this.config.LP_APPS = {};

  Object.keys(apps).forEach(function(appName) {
    appsProcessing.push(lpUtils.getResourcesFromHTMLFiles(this.config.GAIA_DIR,
      path.join(this.config.GAIA_DIR, apps[appName]))
      .then(function(resList) {
        if (resList.size) {
          this.config.LP_APPS[appName] = apps[appName];

          this.config.LP_TASKS.forEach(function(taskName) {
            var task = LangpackBuilder.tasks[taskName];
            tasks.push(
              task(this, locale, apps[appName], resList));
          }, this);
        }
      }.bind(this)));
  }, this);

  Promise.all(appsProcessing).then(function() {
    Promise.all(tasks).then(function() {
      LangpackBuilder.tasks.manifest(this, locale);
      console.log('--- complete');
    }.bind(this));
  }.bind(this));
}

exports.LangpackBuilder = LangpackBuilder;
