#!/usr/bin/env node

'use strict';


var program = require('commander');
var fs = require('fs');
var path = require('path');
var wrench = require('wrench');
var Promise = require('promise');
var Set = require('es6-set');

var utils = require('../lib/utils');

function buildLangpack(gaiaPath, localePath, resultPath) {
  utils.cleanDir(resultPath);

  fs.mkdirSync(path.join(resultPath, 'apps'));
  var apps = fs.readdirSync(path.join(gaiaPath, 'apps'));
  //var apps = ['settings'];

  apps.forEach(function(app) {
    var appPath = path.join(gaiaPath, 'apps', app);
    if (utils.isDirectory(appPath)) {
      getResourcesFromHTMLFiles(gaiaPath, path.join(gaiaPath, 'apps', app))
        .then(function(resList) {
          copyAppData(localePath, resultPath, app, resList);
        }
      );
    }
  });
}

// Lib functions

function copyAppData(localePath, resultPath, app, resList) {
  var sourceAppPath = path.join(localePath, 'apps', app);
  var resultAppPath = path.join(resultPath, 'apps', app, 'locales'); 

  resList.forEach(function(resPath) {
    var pathChunks = utils.splitPath(resPath);

    if (pathChunks[0] === 'shared') {
      pathChunks = pathChunks.filter(function(chunk) {
        return chunk !== 'locales';
      });
      var newPath = path.join.apply(path, pathChunks).replace('.{locale}.', '.');
      var inPath = path.join(localePath, newPath); 
      var outPath = path.join(resultPath, 'apps', app, newPath);

      if (!fs.existsSync(inPath)) {
        console.warn('Warning! Missing file: ' + inPath);
        return;
      }
      utils.copyFile(inPath, outPath);
    } else {
      pathChunks = pathChunks.filter(function(chunk) {
        return chunk !== 'locales';
      });
      var newPath = path.relative(path.join('apps', app),
        path.join.apply(path, pathChunks)).replace('.{locale}.', '.');
      var inPath = path.join(sourceAppPath, newPath); 
      var outPath = path.join(resultPath, 'apps', app, 'locales', newPath);
      
      if (!fs.existsSync(inPath)) {
        console.warn('Warning! Missing file: ' + inPath);
        return;
      }
      utils.copyFile(inPath, outPath);
    }
  });

  var manifestPath = path.join(sourceAppPath, 'manifest.properties');

  if (fs.existsSync(manifestPath)) {
    utils.copyFile(manifestPath,
      path.join(resultPath, 'apps', app, 'manifest.properties'));
  }
}

function flattenResources(gaiaPath, resLists) {
  var flatResources = new Set();
  resLists.forEach(function(resList) {
    resList.forEach(function(resPath) {
      var fullResPath = utils.buildResourcePath(resPath, gaiaPath);
      if (Array.isArray(fullResPath)) {
        fullResPath.forEach(function(p) {
          flatResources.add(p);
        });
      } else {
        flatResources.add(fullResPath);
      }
    });
  });

  return flatResources;
}

function isNotTestFile(path) {
  return path.indexOf('/test/') === -1;
}

function getResourcesFromHTMLFiles(gaiaPath, appPath) {
    var htmlPaths = utils.ls(appPath, true, /\.html$/).filter(isNotTestFile);
    return Promise.all(
      htmlPaths.map(
        utils.getResourcesFromHTMLFile.bind(null, gaiaPath)))
          .then(flattenResources.bind(null, gaiaPath));
}

program
  .version('0.0.1')
  .usage('[options] locale-path result-path')
  .option('-g, --gaia <dir>', 'Gaia dir')
  .parse(process.argv);

var localePath = program.args[0];
var resultPath = program.args[1];
var gaiaPath = program.gaia;

buildLangpack(gaiaPath, localePath, resultPath);
