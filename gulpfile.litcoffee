
# Build processes using [Gulp](http://gulpjs.com)

## Preparation

Load Gulp modules.

    gulp = require 'gulp' # main tool
    coffee = require 'gulp-coffee' # compile coffeescript
    uglify = require 'gulp-uglify' # minify javascript
    sourcemaps = require 'gulp-sourcemaps' # create source maps
    pump = require 'pump' # good error handling of gulp pipes
    shell = require 'gulp-shell' # run external commands

## Record command-line arguments

Some tasks may wish to customize their behavior based on command-line
arguments the user passes.  We therefore record all such switches here into
a single global object from which any task can do a lookup.

    switches = { }
    for piece, index in process.argv
        if piece[0] is '-' then switches[piece.replace /^\-+/, ''] = \
            process.argv[index+1][0] is '-' or process.argv[index+1]

## Build tasks

Create a build task to compile CoffeeScript source into JavaScript.

    gulp.task 'build', ->
        gulp.src 'src/*.litcoffee'
            .pipe sourcemaps.init()
            .pipe coffee bare : yes
            .pipe uglify()
            .pipe sourcemaps.write '.'
            .pipe gulp.dest 'release'

Create "test" task to run unit tests.  If the user calls this with the
syntax `gulp test --only <prefix>` then we will run only test files that
begin with that prefix.  Omitting the `--only` switch means all tests will
be run.

    switches.only ?= ''
    gulp.task 'test', shell.task [
        'node'
        './node_modules/jasmine-node/lib/jasmine-node/cli.js'
        '--verbose --coffee --forceexit'
        "tests/#{switches.only}*.litcoffee"
    ].join ' '

Create "docs" task to build the documentation using
[MkDocs](http://www.mkdocs.org).  This requires that you have `mkdocs`
installed on your system.

    gulp.task 'docs', shell.task 'mkdocs build'

## All tasks

The default task is to do all of the above tasks.

    gulp.task 'default', gulp.series 'build', 'test', 'docs'
