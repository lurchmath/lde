
# Build processes using [Gulp](http://gulpjs.com)

## Preparation

Load Gulp modules.

    gulp = require 'gulp' # main tool
    shell = require 'gulp-shell' # run external commands

## Build tasks

Create "docs" task to build the documentation using
[MkDocs](http://www.mkdocs.org).  This requires that you have `mkdocs`
installed on your system.

    gulp.task 'docs', shell.task 'mkdocs build'

Create a default task that runs all other tasks.

    gulp.task 'default', [ 'docs' ]

