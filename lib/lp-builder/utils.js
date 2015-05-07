var Promise = require('promise');
var Path = require('path');
var utils = require('../utils');
var Set = require('es6-set');
var fs = require('fs');

exports.getAppDirs = function(config) {
  var re = /(.+)\/(.+)/;
  var listPath = Path.join(
    config.GAIA_DIR,
    'build',
    'config',
    config.GAIA_DEVICE_TYPE,
    'apps-' + config.GAIA_APP_TARGET + '.list'); 

  return utils.getFileContent(listPath).then(function(content) {
    var apps = {};
    content.split('\n').forEach(function(line) {
      line = line.trim();
      var matched = line.match(re);
      if (matched) {
        if (matched[2] === '*') {
          var p = Path.join(config.GAIA_DIR, matched[1]);
          if (utils.fileExists(p)) {
            var dirs = utils.getDirs(p);
          }
        } else {
          if (apps[matched[2]]) {
            throw new Error('two apps with same name: \n  - ' + line);
          }
          if (utils.fileExists(Path.join(config.GAIA_DIR, line))) {
            apps[matched[2]] = line;
          }
        }
      } else if (line) {
        var msg = 'Unsupported path "' + line + '" in app list file.';
        console.log(msg);
        throw new Error(msg);
      }
    });
    return apps;
  });
}

exports.buildResourcePath = function(path, gaiaPath) {
  var pathChunks = utils.splitPath(path);
  var pos = pathChunks.indexOf('device_type');

  if (pos !== -1) {
    var fullPath = Path.join(gaiaPath, Path.dirname(path));

    var list = fs.readdirSync(fullPath).filter(function(dir) {
      return utils.isDirectory(Path.join(fullPath, dir));
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

  return path;
}

function importNodesFromSource(source) {
  var links = new Set();
  var match;
  var re = /<link[^>]*href\=\"(\/shared\/pages\/import\/[^"]+\.html)/ig;
  while ((match = re.exec(source)) !== null) {
    links.add(match[1]);
  }
  return links;
}

function extractResourcesFromDocument(gaiaPath, htmlPath, $, source) {
  var resNodes = $('link[rel="localization"]');
  var importNodes = importNodesFromSource(source);
  var links = [];

  function pushToLinks(path) {
    links.push(path);
  }

  for (var i = 0; i < resNodes.length; i++) {
    var link = resNodes[i];
    var path = link.attribs.href;

    var pathChunks = utils.splitPath(path);
    var normalized = (pathChunks[0] === 'shared') ?
      path :
      Path.normalize(
        Path.relative(
          gaiaPath, Path.join(Path.dirname(htmlPath), path)));

    var fullResPath = exports.buildResourcePath(normalized, gaiaPath);
    [].concat(fullResPath).forEach(pushToLinks);
  }

  var subResCalls = [];
  var subRes = {};

  importNodes.forEach(function(importNode) {
    var fullPath = Path.join(gaiaPath, importNode);
    subResCalls.push(exports.getResourcesFromHTMLFile(gaiaPath, fullPath).then(function(res) {
      subRes[importNode] = res[1];
    }));
  }, this);

  return Promise.all(subResCalls).then(function() {
    for (var i in subRes) {
      subRes[i].forEach(function(res) {
        var pathChunks = utils.splitPath(res);
        if (pathChunks[0] === 'shared') {
          links.push(res);
        } else {
          links.push(Path.normalize(
            Path.relative(gaiaPath,
              Path.join(Path.dirname(htmlPath), res))));
        }
      });
    }
    return [htmlPath, links];
  });
}

exports.getResourcesFromHTMLFile = function(gaiaPath, htmlPath) {
  return utils.getFileContent(htmlPath)
    .then(function(content) {
      if (content.indexOf('localization') === -1) {
        return [htmlPath, []];
      } else {
        return utils.getDocument(content).then(function($) {
          return extractResourcesFromDocument(gaiaPath, htmlPath, $, content);
        });
      };
    });
}

function isNotTestFile(path) {
  return path.indexOf('/test/') === -1;
}

exports.getResourcesFromHTMLFiles = function(gaiaPath, appPath) {
    var htmlPaths = utils.ls(appPath, true, /\.html$/).filter(isNotTestFile);
    return Promise.all(
      htmlPaths.map(
        exports.getResourcesFromHTMLFile.bind(null, gaiaPath)));
}

exports.getGaiaVersion = function(gaiaDir) {
  var settingsPath = Path.join(gaiaDir, 'build', 'config',
    'common-settings.json');

  return utils.getFileContent(settingsPath).then(function(source) {
    var settings = JSON.parse(source);
    return settings['moz.b2g.version'];
  });
}
