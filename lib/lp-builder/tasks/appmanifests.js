var fs = require('fs');
var Promise = require('promise');
var path = require('path');
var utils = require('../../utils');
var PropertiesParser = require('../../l10noptimize/parser');

var BuildAppManifests = function(lpBuilder, locale, app, resList) {
  var resultPath = path.join(lpBuilder.config.LP_RESULT_DIR, locale);
  var manifestPath = path.join(
    lpBuilder.config.LOCALE_BASEDIR, app, 'manifest.properties');

  if (!fs.existsSync(manifestPath)) {
    console.warn('Warning! Missing file: ' + manifestPath + ', needed by app: ' + app);
    return Promise.resolve();
  }

  return utils.getFileContent(manifestPath).then(
    PropertiesParser.parse.bind(PropertiesParser)).then(
    l10nASTtoSimpleObj).then(
    JSON.stringify).then(
    utils.writeFile.bind(null, path.join(resultPath, app, 'manifest.json')));
};

function l10nASTtoSimpleObj(ast) {
  return ast.reduce(function(seq, cur) {
    seq[cur.$i] = cur.$v;
    return seq;
  }, Object.create(null));
}

exports.Task = BuildAppManifests;
