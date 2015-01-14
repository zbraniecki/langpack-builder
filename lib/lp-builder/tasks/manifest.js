
var path = require('path');
var utils = require('../../utils');
var Parser = require('../../l10noptimize/parser');
var Promise = require('promise');

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
      var val;
      if (key) {
        val = ast[i][key];
      } else {
        val = ast[i].$v;
      }
      if (Array.isArray(val)) {
        return resolveComplexString(val);
      }
      return val;
    }
  }
  return null;
}

var brandAST = null;

function subPlaceable(id) {
  return getEntryFromAST(brandAST, id);
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

function writeLangpackManifest(lpBuilder, files) {
  brandAST = Parser.parse(files[1]);
  var descAST = Parser.parse(files[0]);
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
  var brandPath = path.join(lpBuilder.config.GAIA_DIR, 'shared', 'locales', 'branding', 'official', 'branding.en-US.properties');

  if (!utils.fileExists(descPath)) {
    console.log("Error: missing manifest description file: " + descPath);
    return;
  }
  var getFiles = [
    utils.getFileContent(descPath),
    utils.getFileContent(brandPath) 
  ];
  return Promise.all(getFiles).then(writeLangpackManifest.bind(null, lpBuilder));
}

exports.Task = addLangpackManifest;
