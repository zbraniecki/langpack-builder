var Promise = require('promise');
var Set = require('es6-set');
var wrench = require('wrench');
var fs = require('fs');
var path = require('path');

var utils = require('../lib/utils');

exports.copyAppData = function(localePath, resultPath, app, resList) {
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
        console.warn('Warning! Missing file: ' + inPath + ', needed by app: ' + app);
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
        console.warn('Warning! Missing file: ' + inPath + ', needed by app: ' + app);
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

exports.getResourcesFromHTMLFiles = function(gaiaPath, appPath) {
    var htmlPaths = utils.ls(appPath, true, /\.html$/).filter(isNotTestFile);
    return Promise.all(
      htmlPaths.map(
        utils.getResourcesFromHTMLFile.bind(null, gaiaPath)))
          .then(flattenResources.bind(null, gaiaPath));
}
