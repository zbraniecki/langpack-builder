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
      var fullPath = path.join(gaiaPath, resPath.replace('{locale}', defaultLocale));
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
            ast[index] = resAST[i];
          } else {
            ast.push(resAST[i]);
          }
        }
      });
      resolve(ast);
    });
  });
}

function buildASTFromContext(gaiaPath, ctxFiles) {
  return new Promise(function(resolve, reject) {
    var filesRead = [];
    var filesAST = {};

    ctxFiles.forEach(function(resPath) {
      var fullPath = path.join(gaiaPath, resPath.replace('{locale}', 'en-US'));
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
            ast[index] = resAST[i];
          } else {
            ast.push(resAST[i]);
          }
        }
      });
      resolve(ast);
    });
  });
}

exports.buildASTFromContext = buildASTFromContext;
