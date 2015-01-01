var Parser = require('./parser');
var utils = require('../utils');
var path = require('path');
var Promise = require('promise');

function buildASTFromContext(gaiaPath, ctxFiles) {
  return new Promise(function(resolve, reject) {
    var ast = [];
    var filesRead = [];

    ctxFiles.forEach(function(resPath) {
      var fullPath = path.join(gaiaPath, resPath.replace('{locale}', 'en-US'));
      filesRead.push(utils.getFileContent(fullPath).then(function(source) {

        var resAST = Parser.parse(source);
        ast = ast.concat(resAST);
      }));
    });

    Promise.all(filesRead).then(function() {
      resolve(ast);
    });
  });
}

exports.buildASTFromContext = buildASTFromContext;
