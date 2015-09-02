'use strict';

var path = require('path');
var utils = require('../../utils');

function flattenSpeechResources(localeDir) {
  var sourcePath = path.join(localeDir, 'speech-data');

  var resPaths = [];
  if (utils.fileExists(sourcePath)) {
    resPaths = utils.ls(sourcePath, false, /.*/);
  }

  return resPaths;
}

var CopySpeechData = function(lpBuilder, locale) {
  var resultPath = path.join(
    lpBuilder.config.LP_RESULT_DIR, locale, 'speech-data');

  var outPath;
  var resPaths = flattenSpeechResources(lpBuilder.config.LOCALE_BASEDIR);
  resPaths.forEach(function(resPath) {
    var filename = resPath.replace(/^.*[\\\/]/, '');
    outPath = path.join(resultPath, filename);
    utils.copyFile(resPath, outPath);
  });
  return Promise.resolve();
};

exports.Task = CopySpeechData;
