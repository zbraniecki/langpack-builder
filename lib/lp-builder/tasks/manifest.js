
var path = require('path');
var utils = require('../../utils');
var Parser = require('../../l10noptimize/parser');

function getTimestamp(date) {
  if (!date) {
    date = new Date();
  }

  var pieces = [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes()
  ];

  return pieces.map(function(piece) {
    return piece < 10 ? '0' + piece.toString() : piece.toString();
  }).join('');
}

function getEntryFromAST(ast, id, key) {
  for (var i = 0; i < ast.length; i++) {
    if (ast[i].$i === id) {
      var val = ast[i][key];
      if (Array.isArray(val)) {
        return resolveComplexString(val);
      }
      return val;
    }
  }
  return null;
}

var ids = {
  'brandShortName': 'Firefox OS'
};

function subPlaceable(id) {
  return ids[id];
}

function resolveComplexString(arr) {
  return arr.reduce(function(prev, cur) {
    if (typeof cur === 'string') {
      return prev + cur;
    } else if (cur.t === 'idOrVar'){
      return prev + subPlaceable(cur.v);
    }
  }, '');
}

function writeLangpackManifest(lpBuilder, desc) {
  var descAST = Parser.parse(desc);
  console.log(JSON.stringify(descAST));
  var manifest = {};

  manifest['name'] = getEntryFromAST(descAST, 'langpack_english', 'name');
  manifest['description'] = getEntryFromAST(descAST, 'langpack_english', 'description');
  manifest['role'] = 'langpack';
  manifest['version'] = '1.0.0';
  manifest.developer = {
    'name': 'Mozilla',
    'url': 'http://www.mozilla.org'
  };
  manifest['languages-target'] = {
    'app://*.gaiamobile.org/manifest.webapp': '2.2'
  };
  manifest['languages-provided'] = {};
  manifest['locales'] = {};

  lpBuilder.config.LOCALES.forEach(function(locale) {
    var origins = {};
    for (var name in lpBuilder.config.LP_APPS) {
      var appID = 'app://' + name + '.gaiamobile.org/manifest.webapp';
      origins[appID] = '/' + locale + '/apps/' + name;
    }
    manifest['languages-provided'][locale] = {
      version: parseInt(getTimestamp()),
      name: getEntryFromAST(descAST, 'language', 'name'),
      apps: origins
    };

    manifest.locales[locale] = {
      'name': getEntryFromAST(descAST, 'langpack_native', 'name'),
      'description': getEntryFromAST(descAST, 'langpack_native', 'description')
    };
  });

  var manifestPath = path.join(lpBuilder.config.LP_RESULT_DIR, 'manifest.webapp');
  utils.writeFile(manifestPath, JSON.stringify(manifest, false, 2));
}

var addLangpackManifest = function(lpBuilder, locale) {
  var descPath = path.join(lpBuilder.config.LOCALE_BASEDIR, 'shared', 'langpack', 'desc.properties');
  if (!utils.fileExists(descPath)) {
    console.log("Error: missing manifest description file: " + descPath);
    return;
  }
  utils.getFileContent(descPath).then(writeLangpackManifest.bind(null, lpBuilder));
}

exports.Task = addLangpackManifest;
