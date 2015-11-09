'use strict';

var L10nPropParser = require('./l10n-properties');
var L20nPropParser = require('./l20n-properties');

exports.parse = function (l10nLib, source) {
  if (l10nLib === 'l10n.js') {
    return L10nPropParser.parse(source);
  } else {
    return L20nPropParser.parse(source);
  }
  throw new Error('Unknown l10n lib: ' + l10nLib);
};
