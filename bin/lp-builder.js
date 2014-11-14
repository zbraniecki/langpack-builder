#!/usr/bin/env node

'use strict';

var program = require('commander');
var fs = require('fs');
var path = require('path');

var utils = require('../lib/utils');
var lpBuilder = require('../lib/lp-builder');

function buildLangpack(gaiaPath, localePath, resultPath, locale) {
  utils.cleanDir(resultPath);

  fs.mkdirSync(path.join(resultPath, locale));
  fs.mkdirSync(path.join(resultPath, locale, 'apps'));
  var apps = utils.getDirs(path.join(gaiaPath, 'apps'));
  //var apps = ['settings'];

  addLangpackManifest(resultPath, [locale], apps);

  apps.forEach(function(app) {
    var appPath = path.join(gaiaPath, locale, 'apps', app);
    lpBuilder.getResourcesFromHTMLFiles(gaiaPath,
      path.join(gaiaPath, 'apps', app))
      .then(function(resList) {
        lpBuilder.copyAppData(localePath, resultPath, locale, app, resList);
      }
    );
  });
}

// Lib functions

function addLangpackManifest(resultPath, locales, apps) {
  var manifest = {};

  manifest.role = 'langpack';
  manifest.version = '1.0.0';
  manifest['languages-target'] = {
    'app://*.gaiamobile.org/manifest.webapp': '2.2'
  };
  manifest['languages-provided'] = {};

  locales.forEach(function(locale) {
    var origins = {};
    apps.forEach(function(app) {
      var appID = 'app://' + app + '.gaiamobile.org/manifest.webapp';
      origins[appID] = '/' + locale + '/apps/' + app;
    });
    manifest['languages-provided'][locale] = {
      version: '2014-11-14-09:59',
      origins: origins
    };
  });
  utils.writeFile(path.join(resultPath, 'manifest.webapp'), JSON.stringify(manifest, false, 2));
}

program
  .version('0.0.1')
  .usage('[options] locale-path')
  .option('-g, --gaia <dir>', 'Gaia dir')
  .option('-l, --locale <locale>', 'Locale')
  .parse(process.argv);

var localePath = program.args[0];
var resultPath = './out/';
var gaiaPath = program.gaia;
var locale = program.locale;

if (!locale || !gaiaPath || program.args.length !== 1) {
  console.log('Example: ./bin/lp-builder.js --gaia /path/to/gaia --locale ab-CD /path/to/gaia-l10n/ab-CD');
  return;
}
buildLangpack(gaiaPath, localePath, resultPath, locale);
