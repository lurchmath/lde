
# Build processes using [Gulp](http://gulpjs.com)

## Preparation

Load Gulp modules.

    gulp = require 'gulp' # main tool
    coffee = require 'gulp-coffee' # compile coffeescript
    uglify = require 'gulp-uglify' # minify javascript
    sourcemaps = require 'gulp-sourcemaps' # create source maps
    pump = require 'pump' # good error handling of gulp pipes
    shell = require 'gulp-shell' # run external commands

## Build tasks

Create a build task to compile CoffeeScript source into JavaScript.

    gulp.task 'build', -> pump [
        gulp.src 'src/*.litcoffee'
        sourcemaps.init()
        coffee bare : yes
        uglify()
        sourcemaps.write '.'
        gulp.dest 'release'
    ]

Create "tests" task to run unit tests.

    gulp.task 'test', shell.task [
        'node'
        './node_modules/jasmine-node/lib/jasmine-node/cli.js'
        '--verbose --coffee --forceexit'
        'tests/*.litcoffee'
    ].join ' '

Create "docs" task to build the documentation using
[MkDocs](http://www.mkdocs.org).  This requires that you have `mkdocs`
installed on your system.

    gulp.task 'docs', shell.task 'mkdocs build'

## All tasks

The default task is to do all of the above tasks.

    gulp.task 'default', gulp.series 'test', 'build', 'docs'
