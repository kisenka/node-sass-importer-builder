<<<<<<< HEAD
# node-sass-importer-builder

Utility to simplify creating importers for node-sass.
Allows to define how node-sass should process `@import` directives with custom resources (e.g. json or js files).

## Usage

```js
var sass = require('node-sass');
var builder = require('node-sass-importer-builder');
var importer = builder(/REGEXP/, function(filepath) {
  return someTransformOperation(filepath);
});

var result = sass.renderSync({
  file: 'example.scss',
  importer: importer
});
```

via Webpack:

```js
var builder = require('node-sass-importer-builder');
var importer = builder(/REGEXP/, function(filepath) {
  return someTransformOperation(filepath);
});

module.exports = {
  module: {
    loaders: [{
      test: /\.scss$/,
      loaders: ["style", "css", "sass"]
    }]
  },

  sassLoader: {
    importer: importer
  }
}
```

## API

### `builder(pattern:RegExp, handler:Function)`

- `pattern` - regular expression pattern to match importing file.
- `handler(filepath)` - function which somehow handles importing file in SASS-compatible data type.
  Invokes with absolute file path as first argument. Function must return string, number, boolean, array, object or null.
  Strings treated as is and becomes a part of final SASS file, so you can include whole files; generate rules, variables,
  mixins and functions here. Other type will be converted in SASS data type and assigned to SASS variable (filename is used as variable name).

### `builder.toSassString(value)`

Helper to convert javascript value to SASS data type. Taken from [rootbeer](https://github.com/gkatsev/rootbeer/blob/master/src/jsToSassString.js) package.

## Examples

### Javascript importer

For example you need to share screen breakpoints config between javascript components and SCSS stylesheets:

```js
// breakpoints.js
module.exports = {
  xsmall: 0, small: 640,
  medium: 960, large: 1200,
  xlarge: 1440
}
```

Here we just calls nodejs `require` to get configuration object and return it:

```js
var importer = builder(/\.js$/, function(filepath) {
  return require(filepath);
});
```

Using this example.scss:
```scss
@import "breakpoints.js";
```

You will get:
```scss
$breakpoints: (
  "xsmall": 0,
  "small": 640,
  "medium": 960,
  "large": 1200,
  "xlarge": 1440
);
```

### YAML importer

```js
var fs   = require('fs');
var yaml = require('js-yaml');
var builder = require('node-sass-importer-builder');
var yamlImporter = builder(/\.yml$/, function(filepath) {
  return yaml.safeLoad(fs.readFileSync(filepath, 'utf8'));
});

```