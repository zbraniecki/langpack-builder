#!/usr/bin/env node

'use strict';

var program = require('commander');

var LangpackBuilder = require('../lib/lp-builder').LangpackBuilder;

var config = {
  GAIA_DEFAULT_LOCALE: 'en-US',
  GAIA_APP_TARGET: 'production',
  MOZILLA_OFFICIAL: 1,
  GAIA_DEVICE_TYPE: 'phone',
  GAIA_DOMAIN: 'gaiamobile.org',
  GAIA_DIR: null,
  GAIA_APPS: null,

  LP_RESULT_DIR: null,
  LP_NAME: null,
  LP_APPS: null,

  LOCALES: null,
  LOCALE_BASEDIR: null,
};


function buildLangpack(gaiaDir, localePath, resultPath,
    locale, name) {

  config.GAIA_DIR = gaiaDir;
  config.LP_RESULT_DIR = resultPath;
  config.LOCALES = [locale];
  config.LP_NAME = name;
  config.LOCALE_BASEDIR = localePath;

  var lpBuilder = new LangpackBuilder(config);
  lpBuilder.init().then(function() {
    lpBuilder.build();
  });
}

program
  .version('0.0.1')
  .usage('[options] locale-path')
  .option('-g, --gaia <dir>', 'Gaia dir')
  .option('-l, --locale <locale>', 'Locale')
  .option('-j, --json', 'pack json files')
  .option('-s, --source', 'pack source files')
  .option('-n, --name <string>', 'langpack name')
  .parse(process.argv);

var localePath = program.args[0];
var resultPath = './out/';
var gaiaDir = program.gaia;
var locale = program.locale;
var name = program.name;

if (!locale || !gaiaDir || program.args.length !== 1) {
  console.log('Example: ./bin/lp-builder.js --gaia /path/to/gaia --locale ab-CD /path/to/gaia-l10n/ab-CD');
  return;
}
buildLangpack(gaiaDir, localePath, resultPath, locale, name);
