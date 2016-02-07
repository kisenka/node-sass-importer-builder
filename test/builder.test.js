var expect = require('chai').expect;
var fs = require('fs');
var factory = require('../lib/builder');
var sass = require('node-sass');

function defaultImporter() {
  return factory(/\.js$/, function (filepath) {
    var imported = require(filepath);
    var result = [];
    Object.keys(imported).forEach(function (key) {
      result.push('$' + key + ': ' + factory.toSassString(imported[key]) + ';');
    });
    return result.join('\n');
  })
}

function render(options, importer) {
  options.importer = importer || defaultImporter();
  options.outputStyle = 'compressed';

  var result = sass.renderSync(options).css.toString();
  return result.replace('\n','');
}


describe('factory', function() {

  it('should throws when call signature is invalid', function() {
    expect(function() { factory() }).to.throws();
    expect(function() { factory('qwe') }).to.throws();
    expect(function() { factory(/\s/) }).to.throws();
    expect(function() { factory(function() {}) }).to.throws();
    expect(function() { factory(/\s/, function() {}) }).to.not.throws();
  });

  it('should export toSassString helper', function() {
    expect(factory).to.have.property('toSassString');
    expect(factory.toSassString).to.be.a('function');
  });

  it('should not process normal imports', function() {
    var result = render({
      data: '@import "import"',
      includePaths: ['./test/fixtures']
    });

    expect(result).to.equals('');
  });

  it('should find imports via include paths', function() {
    var result = render({
      data: '@import "import.js"; body {color: $color}',
      includePaths: ['./test/fixtures/include-paths']
    });

    expect(result).to.equals('body{color:"blue"}');
  });

  it('when multiple includePaths specified first found file takes precedence', function() {
    var data = '@import "import.js"; body {color: $color}';

    var resultRed = render({
      data: data,
      includePaths: ['./test/fixtures', './test/fixtures/include-paths']
    });
    var resultBlue = render({
      data: data,
      includePaths: ['./test/fixtures/include-paths', './test/fixtures']
    });

    expect(resultRed).to.equals('body{color:"red"}');
    expect(resultBlue).to.equals('body{color:"blue"}');
  });

  it('should throws if file not found', function() {
    expect(function() {
      render({
        data: '@import "tralala.js"',
        includePaths: ['./test/fixtures']
      });
    }).to.throws();
  });

  it('should import string as is', function() {
    var result = render({
      data: '@import "import.css";',
      includePaths: ['./test/fixtures/conversion']
    }, factory(/\.css$/, function(filepath) {
      return fs.readFileSync(filepath).toString();
    }));

    expect(result).to.equals('body{color:green}');
  });

  it('should properly convert following types: string, number, boolean, array, object, null', function() {
    var result = render({
      data: [
        '@import "import.js";',
        'body {',
          'content: $string;',
          'content: $number;',
          '@if $boolean { content: "boolean" };',
          'content: $array;',
          'content: length($array);',
          'content: nth($array, 5);',
          'content: map_get($object, "property");',
          'content: $null;',
        '}'
      ].join('\n'),
      includePaths: ['./test/fixtures/conversion']
    });

    expect(result).to.equals([
      'body{',
        'content:"123";',
        'content:123;',
        'content:"boolean";',
        'content:"a","r","r","a","y";',
        'content:5;',
        'content:"y";',
        'content:"object"',
      '}'
    ].join(''))
  });

});