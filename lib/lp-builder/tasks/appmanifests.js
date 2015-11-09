'use strict';

var fs = require('fs');
var path = require('path');
var utils = require('../../utils');
var PropertiesParser = require('../../l10noptimize/parser');

var BuildAppManifests = function(lpBuilder, locale, app) {
  var resultPath = path.join(lpBuilder.config.LP_RESULT_DIR, locale);
  var manifestPath = path.join(
    lpBuilder.config.LOCALE_BASEDIR, app, 'manifest.properties');

  if (!fs.existsSync(manifestPath)) {
    console.warn(
      'Warning! Missing file: ' + manifestPath + ', needed by app: ' + app);
    return Promise.resolve();
  }

  return utils.getFileContent(manifestPath).then(
    PropertiesParser.parse.bind(PropertiesParser, 'l10n.js')).then(
    l10nASTtoSimpleObj.bind(null, app)).then(
    JSON.stringify).then(
    utils.writeFile.bind(null, path.join(resultPath, app, 'manifest.json')));
};

// manifest.properties files don't specify which top-level field the 
// translations correspond to; map known apps to the names of special fields
var nestings = {
  'apps/communications': 'entry_points',
  'apps/keyboard': 'inputs'
};

function l10nASTtoSimpleObj(app, ast) {
  var nesting = nestings[app];

  return ast.reduce(function(seq, cur) {
    if (cur.$v) {
      seq[cur.$i] = cur.$v;
    } else {
      // dialer.name → { entry_points: {dialer: {name: … }}}
      // number.name → { inputs: {number: {name: … }}}
      if (!seq[nesting]) {
        seq[nesting] = {};
      }
      if (!seq[nesting][cur.$i]) {
        seq[nesting][cur.$i] = {};
      }
      for (var attr in cur) {
        if (attr[0] !== '$') {
          seq[nesting][cur.$i][attr] = cur[attr];
        }
      }
    }
    return seq;
  }, {});
}

exports.Task = BuildAppManifests;
