'use strict';

var Parser = require('../parser');
var utils = require('../../utils');

function buildSourceASTFromContext(gaiaPath, resTuple) {
  var filesRead = [];
  var filesAST = {};

  var htmlPath = resTuple[0];
  var l10nLib = resTuple[1];
  var resPaths = resTuple[2];

  resPaths.forEach(function(resPath) {
    var fullPath = utils.getSourcePathFromURI(gaiaPath, resPath);
    filesRead.push(utils.getFileContent(fullPath).then(function(source) {
      var resAST = Parser.parse(l10nLib, source);
      filesAST[resPath] = resAST;
    }));
  });

  return Promise.all(filesRead).then(function() {
    var ast = {};
    resPaths.forEach(function(resPath) {
      var resAST = filesAST[resPath];
      for (var key in resAST) {
        if (!ast.hasOwnProperty(key)) {
          ast[key] = resAST[key];
        }
      }
    });
    return [htmlPath, ast];
  });
}

function buildASTFromContext(gaiaPath, localePath, resTuple) {
  function build(sourceTuple) {
    var filesRead = [];
    var filesAST = {};

    var htmlPath = resTuple[0];
    var l10nLib = resTuple[1];
    var resPaths = resTuple[2];

    resPaths.forEach(function(resPath) {
      var fullPath;
      if (utils.isSubjectToBranding(resPath)) {
        fullPath = utils.getSourcePathFromURI(gaiaPath, resPath);
      } else {
        fullPath = utils.getLocalePathFromURI(localePath, resPath);
      }

      if (utils.fileExists(fullPath)) {
        filesRead.push(utils.getFileContent(fullPath).then(function(source) {
          var resAST = Parser.parse(l10nLib, source);
          filesAST[resPath] = resAST;
        }));
      }
    });

    return Promise.all(filesRead).then(function() {
      var ast = sourceTuple[1];
      resPaths.forEach(function(resPath) {
        var resAST = filesAST[resPath];
        if (!resAST) {
          return;
        }
        for (var key in resAST) {
          if (ast.hasOwnProperty(key)) {
            if (areEntityStructsEqual(ast[key], resAST[key])) {
              ast[key] = resAST[key];
            }
          }
        }
      });
      return [htmlPath, ast];
    });
  }

  return buildSourceASTFromContext(gaiaPath, resTuple).then(build);
}

function areEntityStructsEqual(entity1, entity2) {
  if (typeof entity1 === 'string') {
    return typeof entity2 === 'string';
  }
  var keys1 = Object.keys(entity1);
  var keys2 = Object.keys(entity2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (var i = 0; i < keys1.length; i++) {
    if (keys2.indexOf(keys1[i]) === -1) {
      return false;
    }
  }

  return true;
}

exports.buildASTFromContext = buildASTFromContext;
