
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
 * `release/` folder is where it gets compiled to JavaScript.
    * To do this in your own copy of the repo: run `gulp`.
 * `docs/` is where the documentation source files are written in Markdown.
 * `site/` contains the documentation, compiled to a static site
    * To do this in your own copy of the repo: run `gulp docs`.
    * This requires you to have [mkdocs](http://www.mkdocs.org/) installed.
    * Pushing changes to this folder to GitHub will update the main site
      documentation, linked to above.
 * `tests/` contains the source code for the unit tests.
    * To run all of these in your own copy of the repo: run `gulp test`.

To control how the docs are built, edit [mkdocs.yml](mkdocs.yml).

To control all build processes, edit
[gulpfile.litcoffee](gulpfile.litcoffee).

## License

[![LGPLv3](https://www.gnu.org/graphics/lgplv3-147x51.png)](https://www.gnu.org/licenses/lgpl-3.0.en.html)
