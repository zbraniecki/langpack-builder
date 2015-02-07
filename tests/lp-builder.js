'use strict';

var exec = require('child_process').exec;
fs = require('fs');

/* global suite, test */

var fs = require('fs');
var path = require('path');
var assert = require('assert');

function compareManifests(path1, path2) {
  var source1 = fs.readFileSync(path1, "utf8");
  var source2 = fs.readFileSync(path2, "utf8");

  var man1 = JSON.parse(source1);
  var man2 = JSON.parse(source2);

  man1['languages-provided'].fr.version = null;
  man2['languages-provided'].fr.version = null;
  return assert.deepEqual(man1, man2);
}

suite('Comparison modes', function() {
  test('compare l10n dir to source', function(done) {
    exec('diff -uNr ./tests/out/fr ./tests/fixture/fr', function (error, stdout, stderr) {
      if (stdout.length === 0) {
        compareManifests('./tests/out/manifest.webapp', './tests/fixture/manifest.webapp');
        done();
      } else {
        throw stdout;
      }
    });
  });
});

