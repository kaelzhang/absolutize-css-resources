'use strict';

var expect = require('chai').expect;
var absolutize_css_resources = require('../');

var node_path = require('path');
var node_url = require('url');
var fs = require('fs');

var root = node_path.join(__dirname, 'fixtures');
var expected = node_path.join(__dirname, 'expected');

describe("absolutize", function(){
  it("options.allow_absolute_url -> false", function(done){
    var a_css = node_path.join(root, 'path/a.css');
    absolutize_css_resources(fs.readFileSync(a_css).toString(), {
      filename: a_css,
      resolve: function (relative) {
        return node_url.resolve('http://domain.com/path/', relative);
      },
      filebase: root
    }, function (err, content) {
      expect(/-{26}\^/.test(err.message)).to.equal(true)
      expect(!!~err.message.indexOf('column: 20')).to.equal(true)
      expect(err).not.to.equal(null);
      done()
    });
  });

  it("should replace css background images", function(done){
    var a_css = node_path.join(root, 'path/a.css');
    var a_expected = node_path.join(expected, 'a.css');
    var origins = [];
    var relatives = [];
    absolutize_css_resources(fs.readFileSync(a_css).toString(), {
      filename: a_css,
      resolve: function (relative, callback) {
        var callback = this.async();
        callback(null, node_url.resolve('http://domain.com/path/', relative));
      },
      filebase: root,
      allow_absolute_url: true
    }, function (err, content) {
      expect(err).to.equal(null);
      expect(content).to.equal(fs.readFileSync(a_expected).toString());
      expect(origins).to.deep.equal([
        'a.png',
        'img/a.png',
        'img/a.png',
        'img/b.png',
        '/b.png',
        'data:abc'
      ]);

      expect(relatives).to.deep.equal([
        'path/a.png',
        'path/img/a.png',
        'path/img/a.png',
        'path/img/b.png',
        '/b.png',
        'data:abc'
      ]);

      done()
    }, function(origin, relative){
      origins.push(origin);
      relatives.push(relative);
    });
  });
});
