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

  addLangpackManifest(resultPath, locale, apps);

  apps.forEach(function(app) {
    var appPath = path.join(gaiaPath, locale, 'apps', app);
    lpBuilder.getResourcesFromHTMLFiles(gaiaPath,
      path.join(gaiaPath, 'apps', app))
      .then(function(resList) {
        lpBuilder.copyAppData(localePath, path.join(resultPath, locale), app, resList);
      }
    );
  });
}

// Lib functions

function addLangpackManifest(resultPath, locale, apps) {
  var manifest = {};

  manifest.target = {
    app: 'Gaia',
    version: '2.2'
  };
  manifest.version = '1';
  manifest.role = 'langpack';
  manifest['languages-provided'] = {};

  apps.forEach(function(app) {
    var appID = 'app://' + app + '.gaiamobile.org/manifest.webapp';
    var langs = {};
    langs[locale] = '/' + locale + '/apps/' + app;
    manifest['languages-provided'][appID] = langs;
  });

  utils.writeFile(path.join(resultPath, 'manifest.webapp'), JSON.stringify(manifest, false, 2));
}

program
  .version('0.0.1')
  .usage('[options] locale-path result-path')
  .option('-g, --gaia <dir>', 'Gaia dir')
  .option('-l, --locale <locale>', 'Locale')
  .parse(process.argv);

var localePath = program.args[0];
var resultPath = program.args[1];
var gaiaPath = program.gaia;
var locale = program.locale;

buildLangpack(gaiaPath, localePath, resultPath, locale);
