var path = require('path');
var fs = require('fs');
var sass = require('node-sass');
var isObject = require('is-plain-object');
var isFileExists = require('file-exists');
var toSassString = require('rootbeer').convertJs;

function conversionException() {
  return new Error('Only following types can be converted: string, number, boolean, array, object, null');
}

function assignToSassVariable(varname, content) {
  var content = typeof content !== 'string' ? toSassString(content) : content;
  return '$' + varname + ': ' + content + ';'
}

function factory(pattern, handler) {
  if (!(pattern instanceof RegExp) || typeof handler !== 'function')
    throw new Error('Invalid call signature, must be: (pattern:RegExp, handler:Function)');

  return function (url, prev, done) {
    if (pattern.test(url) === false)
      return sass.NULL;

    var includePaths = [path.dirname(prev)];
    if (this.options.includePaths)
      includePaths = includePaths.concat(this.options.includePaths.split(':'));

    var filepath = null;
    for (var i = 0, len = includePaths.length; i < len; i++) {
      var testingPath = path.resolve(includePaths[i], url);
      if (isFileExists(testingPath)) {
        filepath = testingPath;
        break;
      }
    }

    if (!filepath)
      return new Error('File not found: ' + url + ' (referenced from ' + prev + ')');

    var filename = path.basename(filepath);
    var basename = filename.substr(0, filename.lastIndexOf('.'));
    var processed = handler(filepath, prev);
    var result = '';

    switch (typeof processed) {
      case 'string':
        result = processed;
        break;

      case 'number':
      case 'boolean':
      case 'object':
        if (isObject(processed) || Array.isArray(processed) || processed === null) {
          result = assignToSassVariable(basename, toSassString(processed));
          break;
        }
        throw conversionException();
        break;

      case 'undefined':
      case 'function':
      default:
        throw conversionException();
        break;
    }

    return {
      contents: result
    };
  }
}

module.exports = factory;
module.exports.toSassString = toSassString;