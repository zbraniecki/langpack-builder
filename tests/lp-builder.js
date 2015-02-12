'use strict';
/* global suite, test */

var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var Promise = require('promise');
var deepEqual = require('deep-equal');
var assert = require('assert');

var LangpackBuilder = require('../lib/lp-builder').LangpackBuilder;

function getGaiaRevision() {
  return new Promise(function(resolve, reject) {
    exec('cd ./tests/tmp/gaia && git rev-parse HEAD', function (error, stdout, stderr) {
      var gaia_rev = stdout.trim();
      resolve(gaia_rev);
    });
  });
}

function getLocaleRevision() {
  return new Promise(function(resolve, reject) {
    exec('cd ./tests/tmp/gaia-l10n/fr && hg id -i', function (error, stdout, stderr) {
      var hg_rev = stdout.trim();
      resolve(hg_rev);
    });
  });
}

function verifyRevisions() {
  var source = JSON.parse(fs.readFileSync('./tests/fixture/source.json'));

  var revs = [];

  revs.push(getGaiaRevision());
  revs.push(getLocaleRevision());

  return Promise.all(revs).then(function(revs) {
    if (revs[0] !== source['gaia_revision']) {
      throw new Error("Gaia revision mismatch");
    }
    if (revs[1] !== source['fr_revision']) {
      throw new Error("Locale revision mismatch");
    }
  });
}

function compareManifests(path1, path2) {
  var source1 = fs.readFileSync(path1, "utf8");
  var source2 = fs.readFileSync(path2, "utf8");

  var man1 = JSON.parse(source1);
  var man2 = JSON.parse(source2);

  man1['languages-provided'].fr.version = null;
  man2['languages-provided'].fr.version = null;
  return deepEqual(man1, man2);
}

var rmdir = function(dir) {
	var list = fs.readdirSync(dir);
	for(var i = 0; i < list.length; i++) {
		var filename = path.join(dir, list[i]);
		var stat = fs.statSync(filename);
		
		if(filename == "." || filename == "..") {
			// pass these files
		} else if(stat.isDirectory()) {
			// rmdir recursively
			rmdir(filename);
		} else {
			// rm fiilename
			fs.unlinkSync(filename);
		}
	}
	fs.rmdirSync(dir);
};

function cleanup() {
  if (fs.exists('./tests/out/fr')) {
    rmdir('./tests/out/fr');
  }

  if (fs.exists('./tests/out/manifest.webapp')) {
    fs.unlinkSync('./tests/out/manifest.webapp');
  }
}

function build() {
  var config = {
    GAIA_DEFAULT_LOCALE: 'en-US',
    GAIA_APP_TARGET: 'production',
    MOZILLA_OFFICIAL: 1,
    GAIA_DEVICE_TYPE: 'phone',
    GAIA_DOMAIN: 'gaiamobile.org',
    GAIA_VERSION: null,
    GAIA_DIR: './tests/tmp/gaia',
    GAIA_APPS: null,

    LP_RESULT_DIR: './tests/out',
    LP_VERSION: '1.0.0',
    LP_APPS: null,
    LP_TASKS: ['copy' ,'optimize'],

    LOCALES: ['fr'],
    LOCALE_BASEDIR: './tests/tmp/gaia-l10n/fr',
  };
  var lpBuilder = new LangpackBuilder(config);
  return lpBuilder.init().then(lpBuilder.build.bind(lpBuilder));
}

function compare() {
  return new Promise(function(resolve, reject) {
    exec('diff -uNr ./tests/out/fr ./tests/fixture/fr', function (error, stdout, stderr) {
      if (stdout.length === 0) {
        if (compareManifests('./tests/out/manifest.webapp', './tests/fixture/manifest.webapp')) {
          resolve();
        } else {
          reject('manifest mismatch');
        }
      } else {
        reject(stdout);
      }
    });
  });
}

suite('Lp builder', function() {
  test('build french locale identical to fixture', function(done) {
    verifyRevisions()
      .then(cleanup)
      .then(build)
      .then(compare)
      .then(function() {
      done();
    }).catch(function(e) {
      done(new Error(e));
    });
  });
});
