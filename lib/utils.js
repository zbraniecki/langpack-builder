'use strict';

var fs = require('fs');
var Path = require('path');
var jsdom = require('jsdom');
var Promise = require('promise');
var wrench = require('wrench');
var Set = require('es6-set');

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

exports.loadJSON = function(path) {
  return exports.readFile(path).then(JSON.parse);
};

exports.getDocument = function(content) {
  return new Promise(function(resolve, reject) {
    jsdom.env(content, [], function(errors, window) {
      return errors ? reject(errors) : resolve(window.document);
    });
  });
};

function importNodesFromSource(source) {
  var links = new Set();
  var match;
  var re = /<link[^>]*href\=\"(\/shared\/pages\/import\/[^"]+\.html)/ig;
  while ((match = re.exec(source)) !== null) {
    links.add(match[1]);
  }
  return links;
}

function extractResourcesFromDocument(gaiaPath, htmlPath, docAndContent) {
  return new Promise(function(resolve, reject) {
    var doc = docAndContent[0];
    var source = docAndContent[1];
    try {
    var resNodes = doc.head.querySelectorAll('link[rel="localization"]');
    var importNodes = importNodesFromSource(source);
    var links = [];

    for (var i = 0; i < resNodes.length; i++) {
      var link = resNodes[i];
      var path = link.getAttribute('href');
      var pathChunks = exports.splitPath(path);

      if (pathChunks[0] === 'shared') {
        links.push(path);
      } else {
        links.push(Path.normalize(
          Path.relative(gaiaPath,
            Path.join(Path.dirname(htmlPath), path))));
      }
    }

    var subResCalls = [];
    var subRes = {};

    importNodes.forEach(function(importNode) {
      var fullPath = Path.join(gaiaPath, importNode);
      subResCalls.push(exports.getResourcesFromHTMLFile(gaiaPath, fullPath).then(function(res) {
        subRes[importNode] = res;
      }));
    }, this);

    Promise.all(subResCalls).then(function() {
      for (var i in subRes) {
        subRes[i].forEach(function(res) {
          var pathChunks = exports.splitPath(res);
          if (pathChunks[0] === 'shared') {
            links.push(res);
          } else {
            links.push(Path.normalize(
              Path.relative(gaiaPath,
                Path.join(Path.dirname(htmlPath), res))));
          }
        });
      }
      resolve(links);
    });
    } catch (e) {
      console.log(e);
    }
  });
}

exports.getResourcesFromHTMLFile = function(gaiaPath, htmlPath) {
  return exports.getFileContent(htmlPath)
    .then(function(content) {
      return exports.getDocument(content).then(function(doc) {
        return [doc, content];
      });
    })
    .then(extractResourcesFromDocument.bind(this, gaiaPath, htmlPath));
}

exports.buildResourcePath = function(path, gaiaPath) {
  var pathChunks = exports.splitPath(path);


  var pos = pathChunks.indexOf('device_type');

  if (pos !== -1) {
    var fullPath = Path.join(gaiaPath, Path.dirname(path));

    var list = fs.readdirSync(fullPath).filter(function(dir) {
      return exports.isDirectory(Path.join(fullPath, dir));
    });

    // temporary
    var list = ['phone'];

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
    //pcCopy.splice(pos + 1, 0, 'unofficial');
    pcCopy.splice(pos + 1, 0, 'official');
    return Path.join.apply(Path, pcCopy);
  }
  
  return path;
}

exports.isSubjectToBranding = function(path) {
  return /\/branding\//.test(path);
}

////////

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
