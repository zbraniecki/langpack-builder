#!/usr/bin/env node

'use strict';

var program = require('commander');
var fs = require('fs');
var path = require('path');

var utils = require('../lib/utils');
var lpBuilder = require('../lib/lp-builder');

var config = {
  GAIA_DEFAULT_LOCALE: 'en-US',
  MOZILLA_OFFICIAL: 1,
  DEVICE_TYPE: 'phone'
};

function buildLangpack(gaiaPath, localePath, resultPath,
    locale, releaseUrl, name) {
  utils.cleanDir(resultPath);

  fs.mkdirSync(path.join(resultPath, locale));
  fs.mkdirSync(path.join(resultPath, locale, 'apps'));
  var apps = utils.getDirs(path.join(gaiaPath, 'apps'));
  //var apps = ['system'];

  addLangpackManifest(resultPath, [locale], apps, releaseUrl, name);

  apps.forEach(function(app) {
    var appPath = path.join(gaiaPath, locale, 'apps', app);
    lpBuilder.getResourcesFromHTMLFiles(gaiaPath,
      path.join(gaiaPath, 'apps', app))
      .then(function(resList) {
        if (resList.size) {
          //lpBuilder.copyAppData(localePath, resultPath, locale, app, resList);

          lpBuilder.buildOptimizedAST(gaiaPath, resultPath, locale, app, resList);
        }
      }
    );
  });
}

// Lib functions

function getTimestamp(date) {
  if (!date) {
    date = new Date();
  }

  var pieces = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes()
  ];

  return pieces.map(function(piece) {
    return piece < 10 ? '0' + piece.toString() : piece.toString();
  }).join('');
}

function addLangpackManifest(resultPath, locales, apps, releaseUrl, name) {
  var manifest = {};

  manifest.name = name;
  manifest.role = 'langpack';
  manifest.version = '1.0.0';
  manifest.developer = {
    'name': 'Mozilla',
    'url': releaseUrl
  };
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
      version: parseInt(getTimestamp()),
      apps: origins
    };
  });
  utils.writeFile(path.join(resultPath, 'manifest.webapp'), JSON.stringify(manifest, false, 2));
}

program
  .version('0.0.1')
  .usage('[options] locale-path')
  .option('-g, --gaia <dir>', 'Gaia dir')
  .option('-l, --locale <locale>', 'Locale')
  .option('-r, --release-url <url>', 'URL used to distribute the package')
  .option('-j, --json', 'pack json files')
  .option('-s, --source', 'pack source files')
  .option('-n, --name <string>', 'langpack name')
  .parse(process.argv);

var localePath = program.args[0];
var resultPath = './out/';
var gaiaPath = program.gaia;
var locale = program.locale;
var releaseUrl = program.releaseUrl;
var name = program.name;

if (!locale || !gaiaPath || program.args.length !== 1) {
  console.log('Example: ./bin/lp-builder.js --gaia /path/to/gaia --locale ab-CD /path/to/gaia-l10n/ab-CD');
  return;
}
buildLangpack(gaiaPath, localePath, resultPath, locale, releaseUrl, name);
