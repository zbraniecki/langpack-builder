var Promise = require('promise');
var Set = require('es6-set');
var wrench = require('wrench');
var fs = require('fs');
var path = require('path');

var utils = require('./utils');
var l10nOptimizer = require('./l10noptimize');

exports.copyAppData = function(localePath, resultPath, locale, app, resList) {
  var resultPath = path.join(resultPath, locale);
  var sourceAppPath = path.join(localePath, 'apps', app);
  var resultAppPath = path.join(resultPath, 'apps', app, 'locales'); 

  resList.forEach(function(resPath) {
    var pathChunks = utils.splitPath(resPath);

    if (pathChunks[0] === 'shared') {
      pathChunks = pathChunks.filter(function(chunk) {
        return chunk !== 'locales';
      });
      var newPath = path.join.apply(path, pathChunks);
      var inPath = path.join(localePath, newPath.replace('.{locale}.', '.'));
      var outPath = path.join(resultPath, 'apps', app, newPath.replace('.{locale}.', '.' + locale + '.'));

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
        path.join.apply(path, pathChunks));
      var inPath = path.join(sourceAppPath, newPath.replace('.{locale}.', '.'));
      var outPath = path.join(resultPath, 'apps', app, 'locales', newPath.replace('.{locale}.', '.' + locale + '.'));
      
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

exports.buildOptimizedAST = function(gaiaPath, localePath, resultPath, locale, app, resList) {
  l10nOptimizer.buildASTFromContext(gaiaPath, localePath, resList).then(function(ast) {
    var source = JSON.stringify(ast);
    if (!utils.fileExists(path.join(resultPath, locale, 'apps', app))) {
      fs.mkdirSync(path.join(resultPath, locale, 'apps', app));
    }
    fs.mkdirSync(path.join(resultPath, locale, 'apps', app, 'locales-obj'));
    utils.writeFile(path.join(resultPath, locale, 'apps', app, 'locales-obj', locale + '.json'), source);
  });
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
