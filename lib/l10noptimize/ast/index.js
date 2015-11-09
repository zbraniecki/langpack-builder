'use strict';

var L10nAST = require('./l10n-ast');
var L20nAST = require('./l20n-ast');

function buildASTFromContext(gaiaPath, localePath, resTuple) {
  var l10nLib = resTuple[1];
  console.log(l10nLib);

  if (l10nLib === 'l10n.js') {
    return L10nAST.buildASTFromContext(gaiaPath, localePath, resTuple);
  } else if (l10nLib === 'l20n.js') {
    return L20nAST.buildASTFromContext(gaiaPath, localePath, resTuple);
  }
  throw new Error('Unknown l10n lib: ' + l10nLib);
}

exports.buildASTFromContext = buildASTFromContext;
