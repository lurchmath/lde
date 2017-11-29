
# The Lurch Deductive Engine (LDE)

[See documentation on the project website.](http://lurchmath.github.io/lde)

## Getting started with development

 * Install [node](https://nodejs.org/en/) and [npm](https://www.npmjs.com/).
 * Install [gulp](https://gulpjs.com/) globally
   (`npm install gulp-cli -g`).
 * Clone this repo.
 * In the repo, run `npm install`.

## Repository structure

 * `src/` folder is where the code is, in
   [Literate CoffeeScript](http://coffeescript.org/#literate).
 * `release/` folder is where it gets compiled to JavaScript; you can do
   this in your own copy of the repo by running `gulp` with no arguments.
 * `docs/` is where the documentation source files are written in Markdown.
 * `site/` contains the documentation, compiled to a static site; you can
   build this yourself by running `gulp docs` within the repo folder.
   This requires you to have [mkdocs](http://www.mkdocs.org/) installed.
 * `tests/` contains the source code for the unit tests; you can run all of
   these from the command line with `gulp test`, within the repo folder.

To control how the docs are built, edit [mkdocs.yml](mkdocs.yml).

To control all build processes, edit
[gulpfile.litcoffee](gulpfile.litcoffee).

## License

[![LGPLv3](https://www.gnu.org/graphics/lgplv3-147x51.png)](https://www.gnu.org/licenses/lgpl-3.0.en.html)
