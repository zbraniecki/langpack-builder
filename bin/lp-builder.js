#!/usr/bin/env node

'use strict';

var program = require('commander');
var lpUtils = require('../lib/lp-builder/utils');
var path = require('path');

var LangpackBuilder = require('../lib/lp-builder').LangpackBuilder;

var config = {
  GAIA_DEFAULT_LOCALE: 'en-US',
  GAIA_APP_TARGET: 'production',
  MOZILLA_OFFICIAL: 1,
  GAIA_DEVICE_TYPE: 'phone',
  GAIA_DOMAIN: 'gaiamobile.org',
  GAIA_VERSION: null,
  GAIA_DIR: null,
  GAIA_APPS: null,

  LP_RESULT_DIR: null,
  LP_VERSION: null,
  LP_APPS: null,
  LP_APP_TASKS: ['copy', 'appmanifests', 'optimize'],
  LP_LOCALE_TASKS: ['copySpeechData'],

  LOCALES: null,
  LOCALE_BASEDIR: null,
};

function buildLangpack(gaiaDir, localePath, resultPath, locale, appTasks, localeTasks, version) {

  config.GAIA_DIR = gaiaDir;
  config.LP_RESULT_DIR = resultPath;
  config.LOCALES = [locale];
  config.LOCALE_BASEDIR = localePath;
  config.LP_APP_TASKS = appTasks;
  config.LP_VERSION = version;
  config.LP_LOCALE_TASKS = localeTasks;

  var lpBuilder = new LangpackBuilder(config);
  lpBuilder.init().then(
    lpBuilder.build.bind(lpBuilder)).then(function() {
      console.log('--- complete');
    }).catch(console.error.bind(console));
}

program
  .version('0.0.1')
  .usage('[options] locale-path')
  .option('-g, --gaia <dir>', 'Gaia dir')
  .option('-l, --locale <locale>', 'Locale')
  .option('-j, --json', 'pack json files')
  .option('-s, --source', 'pack source files')
  .option('-t, --target <dir>', 'target directory [out]')
  .option('--lp_version <ver>', 'langpack version [1.0.0]')
  .parse(process.argv);

var localePath = program.args[0];
var resultPath = program.target || './out/';
var gaiaDir = program.gaia;
var locale = program.locale;
var version = program.lp_version || '1.0.0';

var appTasks = [];
var localeTasks = [];
if (!program.source && !program.json) {
  appTasks = ['copy', 'appmanifests', 'optimize'];
  localeTasks = ['copySpeechData'];
} else {
  if (program.source) {
    appTasks.push('copy');
    localeTasks.push('copySpeechData');
  }
  if (program.json) {
    appTasks.push('optimize');
  }
  appTasks.push('appmanifests');
}

if (!locale || !gaiaDir || program.args.length !== 1) {
  console.log('Example: ./bin/lp-builder.js --gaia /path/to/gaia --locale ab-CD /path/to/gaia-l10n/ab-CD');
  return;
}
buildLangpack(gaiaDir, localePath, resultPath, locale, appTasks, localeTasks, version);
