Equestria.tv Gulpfile
=========================

## Config

    autoprefixerConfig =
      browsers: ['> 5%']
      cascade: true

## Dependencies

#### Base Deps

    gulp = require 'gulp'
    concat = require 'gulp-concat'

#### Gulp Utils

    livereload = require 'gulp-livereload'
    plumber = require 'gulp-plumber'
    notify = require 'gulp-notify'

#### Browser Utilities

    autoprefixer = require 'gulp-autoprefixer'

#### Pre-compilers

    sass = require 'gulp-sass'

## Tasks

SCSS Compilation

    gulp.task 'css', () ->
      gulp.src 'resources/stylesheets/eqtv.scss'
        .pipe plumber({errorHandler: notify.onError("Error: <%= error.message %>")})
        .pipe sass()
        .pipe autoprefixer autoprefixerConfig
        .pipe gulp.dest 'www/css'
        .pipe notify 'Application SCSS has been compiled'

Copy fonts

    gulp.task 'copy:fonts', () ->
      gulp.src [
        'bower_components/bootstrap-sass/assets/fonts/**/*'
        'bower_components/font-awesome/fonts/**/*'
      ]
        .pipe gulp.dest('www/fonts')

Realtime Compilation

    gulp.task 'watch', ['build'], () ->
      livereload.listen();

      gulp.watch('resources/stylesheets/**/*.scss', ['css'])
      gulp.watch('www/css/eqtv.css').on 'change', livereload.changed

Build everything!

    gulp.task 'build', ['css', 'copy:fonts']
    # Not much else to do here - everything has already run!

Default Task

    gulp.task 'default', ['build'] # All we do is call build!

Credit where credit is due, this has been copied from Poniverse and modified for use within Socrates.