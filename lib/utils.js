'use strict';

var fs = require('fs');
var Path = require('path');
var cheerio = null;
var Promise = require('promise');
var wrench = require('wrench');

exports.ls = function ls(dir, recursive, pattern) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = Path.join(dir, file);
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

exports.getDirs = function(dir) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function(file) {
    var path = Path.join(dir, file);
    var stat = fs.statSync(path);
    if (stat && stat.isDirectory()) {
      results.push(file);
    }
  });
  return results;
}

exports.copyFile = function(path1, path2) {
  if (!fs.exists(Path.dirname(path2))) {
    wrench.mkdirSyncRecursive(Path.dirname(path2));
  }
  fs.createReadStream(path1).pipe(fs.createWriteStream(path2));
};

exports.fileExists = function(path) {
  var stat;
  try {
    stat = fs.statSync(path);
  } catch(e) {
  }
  return !!stat;
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

exports.writeFile = function(path, content) {
  if (!fs.exists(Path.dirname(path))) {
    wrench.mkdirSyncRecursive(Path.dirname(path));
  }
  fs.writeFileSync(path, content);
}

exports.getFileContent = function(path, type) {
  return exports.readFile(path, type || 'utf-8');
};

exports.splitPath = function(path) {
  return path.split(Path.sep).filter(function(elem) {
    return elem.length;
  });
};

exports.getDocument = function(content) {
  return new Promise(function(resolve, reject) {
    if (!cheerio) {
      cheerio = require('cheerio');
    }
    var $ = cheerio.load(content);
    resolve($);
  });
};

exports.isSubjectToBranding = function(path) {
  return /\/branding\//.test(path);
}

exports.getSourcePathFromURI = function(gaiaPath, uri) {
  return Path.join(gaiaPath, uri.replace('{locale}', 'en-US'));
}

exports.getLocalePathFromURI = function(localePath, uri) {
  var pathChunks = exports.splitPath(uri).filter(function(chunk) {
    return chunk !== 'locales';
  });

  uri = Path.join.apply(Path, pathChunks);

  uri = uri.replace('.{locale}.', '.');

  return Path.join(localePath, uri);
}
