'use strict';

var fs = require('fs');
var Path = require('path');
var jsdom = require('jsdom');
var Promise = require('promise');
var wrench = require('wrench');

exports.ls = function ls(dir, recursive, pattern) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (recursive) {
        results = results.concat(ls(file, recursive, pattern));
      }
    } else {
      if (!pattern || pattern.test(file)) {
        results.push(file);
      }
    }
  });
  return results;
};

exports.copyFile = function(path1, path2) {
  if (!fs.exists(Path.dirname(path2))) {
    wrench.mkdirSyncRecursive(Path.dirname(path2));
  }
  fs.createReadStream(path1).pipe(fs.createWriteStream(path2));
};

exports.cleanDir = function(dirPath) {
  var files = fs.readdirSync(dirPath);
  for (var i = 0; i < files.length; i++) {
    var file = Path.join(dirPath, files[i]);
    if (exports.isDirectory(file)) {
      wrench.rmdirSyncRecursive(Path.join(dirPath, files[i]));
    } else {
      fs.unlinkSync(file);
    }
  }
};

exports.isDirectory = function(path) {
  var stat = fs.statSync(path);
  return stat.isDirectory();
}

exports.readFile = function(path, type) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path, {encoding: type}, function(err, data) {
      return err ? reject(err) :  resolve(data);
    });
  });
};

exports.getFileContent = function(path, type) {
  return exports.readFile(path, type || 'utf-8');
};

exports.splitPath = function(path) {
  return path.split(Path.sep).filter(function(elem) {
    return elem.length;
  });
};

exports.loadJSON = function(path) {
  return exports.readFile(path).then(JSON.parse);
};

exports.getDocument = function(content) {
  return new Promise(function (resolve, reject) {
    jsdom.env(content, [], function(errors, window) {
      return errors ? reject(errors) : resolve(window.document);
    });
  });
};

exports.getResourcesFromHTMLFile = function(gaiaPath, htmlPath) {
  return exports.getFileContent(htmlPath)
    .then(exports.getDocument)
    .then(function(doc) {
      return Array.prototype.map.call(
        doc.head.querySelectorAll('link[rel="localization"]'),
        function(link) {
          var path = link.getAttribute('href');
          var pathChunks = exports.splitPath(path);

          if (pathChunks[0] === 'shared') {
            return path;
          }
          return Path.normalize(
            Path.relative(gaiaPath,
              Path.join(Path.dirname(htmlPath), path)));
        });
    });
}

exports.buildResourcePath = function(path, gaiaPath) {
  var pathChunks = exports.splitPath(path);


  var pos = pathChunks.indexOf('device_type');

  if (pos !== -1) {
    var fullPath = Path.join(gaiaPath, Path.dirname(path));

    var list = fs.readdirSync(fullPath).filter(function(dir) {
      return exports.isDirectory(Path.join(fullPath, dir));
    });

    var result = [];

    list.forEach(function(type) {
      var pcCopy = pathChunks.slice(0);
      pcCopy.splice(pos + 1, 0 , type);
      result.push(Path.join.apply(Path, pcCopy));
    });
    return result;
  }

  pos = pathChunks.indexOf('branding');

  if (pos !== -1) {
    // one day we'll want to add 'official' scenario for en-US
    var pcCopy = pathChunks.slice(0);
    pcCopy.splice(pos + 1, 0, 'unofficial');
    return Path.join.apply(Path, pcCopy);
  }
  
  return path;
}
