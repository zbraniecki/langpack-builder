'use strict';

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');

var sourceGlob = './{bin,lib,tests}/**/*.js';

gulp.task('default', ['lint', 'test']);

gulp.task('lint', function() {
    return gulp.src(sourceGlob)
      .pipe(jshint())
      .pipe(jshint.reporter(stylish));
});

gulp.task('test', function () {
  return gulp.src('tests/*.js', { read: false })
    .pipe(mocha({ ui: 'tdd' }));
});

gulp.task('watch', function() {
    return gulp.watch(sourceGlob, ['test']);
});
