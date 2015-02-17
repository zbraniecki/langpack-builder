langpack-builder
================

A tool for building language packages for Firefox OS.


Installation
------------

    npm install


Usage
-----

```
  Usage: lp-builder [options] locale-path

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -g, --gaia <dir>       Gaia dir
    -l, --locale <locale>  Locale
    -j, --json             pack json files
    -s, --source           pack source files
    -t, --target <dir>     target directory [out]
    --lp_version <ver>     langpack version [1.0.0]
```


Examples
--------

    ./bin/lp-builder.js --gaia /path/to/gaia --locale ab-CD /path/to/gaia-l10n/ab-CD


Running tests
-------------

In order to run tests you need to have a clone of the Gaia repository and 
a clone of the gaia-l10n/fr repository, both checked out at the specific 
revision expected by the test fixtures.

    mkdir -p tests/tmp/gaia-l10n
    cd tests/tmp

    git clone https://github.com/mozilla-b2g/gaia.git
    cd gaia
    git checkout 791e53728cd8018f1d7cf7efe06bbeb1179f0370
    cd ..

    cd gaia-l10n
    hg clone https://hg.mozilla.org/gaia-l10n/fr
    cd fr
    hg update 08d663e504a9

You should now be able to run tests by issuing the following command:

    gulp test

