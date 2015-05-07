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
  LP_TASKS: ['copy', 'appmanifests', 'optimize'],

  LOCALES: null,
  LOCALE_BASEDIR: null,
};

function buildLangpack(gaiaDir, localePath, resultPath, locale, tasks, version) {

  config.GAIA_DIR = gaiaDir;
  config.LP_RESULT_DIR = resultPath;
  config.LOCALES = [locale];
  config.LOCALE_BASEDIR = localePath;
  config.LP_TASKS = tasks;
  config.LP_VERSION = version;

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

var tasks = [];
if (!program.source && !program.json) {
  tasks = ['copy', 'appmanifests', 'optimize'];
} else {
  if (program.source) {
    tasks.push('copy');
  }
  if (program.json) {
    tasks.push('optimize');
  }
  tasks.push('appmanifests');
}

if (!locale || !gaiaDir || program.args.length !== 1) {
  console.log('Example: ./bin/lp-builder.js --gaia /path/to/gaia --locale ab-CD /path/to/gaia-l10n/ab-CD');
  return;
}
buildLangpack(gaiaDir, localePath, resultPath, locale, tasks, version);
