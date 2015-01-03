var Parser = require('./parser');
var utils = require('../utils');
var path = require('path');
var Promise = require('promise');

var defaultLocale = 'en-US';

function buildSourceASTFromContext(gaiaPath, ctxFiles) {
  return new Promise(function(resolve, reject) {
    var filesRead = [];
    var filesAST = {};

    ctxFiles.forEach(function(resPath) {
      var fullPath = utils.getSourcePathFromURI(gaiaPath, resPath);
      filesRead.push(utils.getFileContent(fullPath).then(function(source) {
        var resAST = Parser.parse(source);
        filesAST[resPath] = resAST;
      }));
    });

    Promise.all(filesRead).then(function() {
      var ast = [];
      ctxFiles.forEach(function(resPath) {
        var resAST = filesAST[resPath];
        for (var i = 0; i < resAST.length; i++) {
          var index = -1;
          for (var j = 0; j < ast.length; j++) {
            if (ast[j]['$i'] === resAST[i]['$i']) {
              index = j;
              break;
            }
          }
          if (index !== -1) {
            //ast[index] = resAST[i];
          } else {
            ast.push(resAST[i]);
          }
        }
      });
      resolve(ast);
    });
  });
}

function buildASTFromContext(gaiaPath, localePath, ctxFiles) {
  return new Promise(function(resolve, reject) {
    buildSourceASTFromContext(gaiaPath, ctxFiles).then(function(sourceAST) {

      var filesRead = [];
      var filesAST = {};

      ctxFiles.forEach(function(resPath) {
        var fullPath;
        if (utils.isSubjectToBranding(resPath)) {
          fullPath = utils.getSourcePathFromURI(gaiaPath, resPath);
        } else {
          fullPath = utils.getLocalePathFromURI(localePath, resPath);
        }

        filesRead.push(utils.getFileContent(fullPath).then(function(source) {
          var resAST = Parser.parse(source);
          filesAST[resPath] = resAST;
        }));
      });

      Promise.all(filesRead).then(function() {
        var ast = sourceAST;
        ctxFiles.forEach(function(resPath) {
          var resAST = filesAST[resPath];
          for (var i = 0; i < resAST.length; i++) {
            var index = -1;
            for (var j = 0; j < ast.length; j++) {
              if (ast[j]['$i'] === resAST[i]['$i']) {
                index = j;
                break;
              }
            }
            if (index !== -1) {
              if (areEntityStructsEqual(ast[index], resAST[i])) {
                ast[index] = resAST[i];
              }
            }
          }
        });
        resolve(ast);
      });
    });
  });
}

function areEntityStructsEqual(entity1, entity2) {
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
