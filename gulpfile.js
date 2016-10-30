'use strict';

var gulp        = require('gulp'),
    concat      = require('gulp-concat'),
    uglify      = require('gulp-uglify'),
    connect     = require('gulp-connect'),
    rename      = require('gulp-rename'),
    sass        = require('gulp-sass'),
    prefix      = require('gulp-autoprefixer'),
    runSequence = require('run-sequence'),
    maps        = require('gulp-sourcemaps'),
    cleanCSS    = require('gulp-clean-css'),
    clean       = require('gulp-clean');

var scssFiles = './src/sass/**/*.scss';
var htmlFile = './src/index.html';
var customFonts = './src/fonts/';
var fontAwesomeFonts = './node_modules/font-awesome/fonts/**/*.*';
// Add your external libs css here
var libCssFiles = [
    './node_modules/normalize.css/*.css',
    './node_modules/foundation-sites/dist/foundation-flex.min.css',
    './node_modules/font-awesome/css/font-awesome.min.css'
];
// Add your external libs js here
var libJsFiles = [
];
var finalVersionFolder = './public/';
var finalScriptFolder = finalVersionFolder + 'js/';
var finalStyleFolder = finalVersionFolder + 'css/';
var finalFontFolder = finalVersionFolder + 'fonts/';

// Styles Gulp tasks
// ----------------------------------------------------------------------------
gulp.task('libcss', function () {
    return gulp.src(libCssFiles)
        .pipe(concat('libs.css'))
        .pipe(cleanCSS({compatibility: 'ie10'}))
        .pipe(gulp.dest(finalStyleFolder))
        .pipe(connect.reload());
});

gulp.task('libjs', function () {
    return gulp.src(libJsFiles)
        .pipe(concat('libs.js'))
        .pipe(gulp.dest(finalScriptFolder))
        .pipe(connect.reload());
});

gulp.task('sass', function() {
  return gulp.src(scssFiles)
    .pipe(maps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(prefix({
        browsers: ['last 2 versions'],
        cascade: false
    }))
    .pipe(concat('site.css'))
    .pipe(maps.write('./'))
    .pipe(gulp.dest(finalStyleFolder))
    .pipe(connect.reload());
});

gulp.task('html', function () {
  gulp.src(htmlFile)
    .pipe(gulp.dest(finalVersionFolder))
    .pipe(connect.reload());
});

gulp.task('font-awesome-fonts', function() {
    gulp.src([fontAwesomeFonts, customFonts])
        .pipe(gulp.dest(finalFontFolder))
        .pipe(connect.reload());
});

// React Gulp tasks
// ----------------------------------------------------------------------------
 var browserify = require('browserify'),
     babelify   = require('babelify'),
     gutil      = require('gulp-util'),
     source     = require('vinyl-source-stream');

var reactFiles = './src/**/*.js';
var reactAppFile = './src/app.js';
var reactCoreFinalFile = 'mainReactCore.js';
var reactFinalAppFile = 'mainJs.js';

// External dependencies you do not want to rebundle while developing,
// but include in your application deployment
var dependencies = [
    'react',
    'react-dom'
];
// keep a count of the times a task refires
var scriptsCount = 0;

gulp.task('react', function () {
    return bundleApp(false).pipe(connect.reload());
});
 
gulp.task('deploy', function (){
    bundleApp(true);
});

// Private Functions
// ----------------------------------------------------------------------------
function bundleApp(isProduction) {
    scriptsCount++;
    console.log(scriptsCount);
    // Browserify will bundle all our js files together in to one and will let
    // us use modules in the front end.
    var appBundler = browserify({
        entries: reactAppFile,
        debug: true
    })
 
    // If it's not for production, a separate vendors.js file will be created
    // the first time gulp is run so that we don't have to rebundle things like
    // react everytime there's a change in the js file
    if (!isProduction && scriptsCount === 1){
        // create vendors.js for dev environment.
        browserify({
            require: dependencies,
            debug: true
        })
            .bundle()
            .on('error', gutil.log)
            .pipe(source(reactCoreFinalFile))
            .pipe(gulp.dest(finalScriptFolder));
    }
    if (!isProduction){
        // make the dependencies external so they dont get bundled by the 
        // app bundler. Dependencies are already bundled in vendor.js for
        // development environments.
        dependencies.forEach(function(dep){
            appBundler.external(dep);
        })
    }
 
    return appBundler
        // transform ES6 and JSX to ES5 with babelify
        .transform("babelify", {presets: ["es2015", "react"]})
        .bundle()
        .on('error',gutil.log)
        .pipe(source(reactFinalAppFile))
        .pipe(gulp.dest(finalScriptFolder));
}

// Common Gulp tasks
// ----------------------------------------------------------------------------
gulp.task('watch', function() {
  gulp.watch(scssFiles,['sass']);
  gulp.watch(htmlFile,['html']);
  gulp.watch(libCssFiles,['libcss']);
  gulp.watch(libJsFiles,['libjs']);
  gulp.watch(reactFiles,['react']);
});

gulp.task('connect', function () {
    connect.server({
        root: finalVersionFolder,
        livereload: true,
        port: 4000
    })
});
 
gulp.task('clean', function (){    
    return gulp.src(finalVersionFolder, {read: false})
        .pipe(clean());
});

gulp.task('default', function(callback) {
    runSequence('clean', 'html', 'sass', 'react', 'libcss', 'libjs', 'font-awesome-fonts', 'watch', 'connect',
        callback
    );
});
