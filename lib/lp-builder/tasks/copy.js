var fs = require('fs');
var Promise = require('promise');
var path = require('path');
var utils = require('../../utils');

var CopyAppData = function(lpBuilder, locale, app, resList) {
  var resultPath = path.join(lpBuilder.config.LP_RESULT_DIR, locale);
  var sourceAppPath = path.join(lpBuilder.config.LOCALE_BASEDIR, app);
  var resultAppPath = path.join(lpBuilder.config.LP_RESULT_DIR, app, 'locales'); 

  resList.forEach(function(resPath) {
    var pathChunks = utils.splitPath(resPath);

    if (pathChunks[0] === 'shared') {
      pathChunks = pathChunks.filter(function(chunk) {
        return chunk !== 'locales';
      });
      var newPath = path.join.apply(path, pathChunks);
      var inPath = path.join(lpBuilder.config.LOCALE_BASEDIR, newPath.replace('.{locale}.', '.'));
      var outPath = path.join(resultPath, app, newPath.replace('.{locale}.', '.' + locale + '.'));

      if (!fs.existsSync(inPath)) {
        console.warn('Warning! Missing file: ' + inPath + ', needed by app: ' + app);
        return;
      }
      utils.copyFile(inPath, outPath);
    } else {
      pathChunks = pathChunks.filter(function(chunk) {
        return chunk !== 'locales';
      });
      var newPath = path.relative(app, path.join.apply(path, pathChunks));
      var inPath = path.join(sourceAppPath, newPath.replace('.{locale}.', '.'));
      var outPath = path.join(resultPath, app, 'locales', newPath.replace('.{locale}.', '.' + locale + '.'));
      
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
      path.join(resultPath, app, 'manifest.properties'));
  }
  return Promise.resolve();
}

exports.Task = CopyAppData;
