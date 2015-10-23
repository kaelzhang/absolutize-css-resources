'use strict';

module.exports = absolutize;
absolutize.resolve = resolve;

var node_url = require('url');
var node_path = require('path');
var async = require('async');
var unique = require('array-unique');

//                     0     1      2
var REGEX_CSS_IMAGE = /url\((['"])?([^'"]+)$1\)/ig;

// @param {options}
// - filename: `path`
// - resolve: `function(path, callback)` the function to resolve relative filename to url
// - filebase: `path`
// - path: ``
// - allow_absolute_url: `Boolean` default to false
function absolutize (content, options, callback) {
  var found = [];

  var match;
  while(match = REGEX_CSS_IMAGE.exec(content)){
    found.push(match[2]);  
  }

  found = unique(found);

  async.each(found, function (relative_path, done) {
    if (isAbsolute(relative_path) && !options.allow_absolute_url) {
      return done(new Error('absolute css resources are not allowed: ' + relative_path));
    }

    var parsed_relative = path_relative(relative_path, options);
    options.resolve(parsed_relative, function (err, resolved) {
      if (err) {
        return done(err);
      }

      content = content.replace(relative_path, resolved);
      done();
    });

  }, function (err) {
    callback(err, content);
  });
}


function is_absolute (path) {
  var parsed = node_url.parse(path);
  // 'http://domain.com/a.js'
  return !!parsed.protocol 
    || is_path_absolute(path)
    || false;
}


function is_path_absolute (path) {
  return path.startsWith('/');
}


function path_relative (path, options) {
  var dirname = node_path.dirname(options.filename);
  var resolved = node_path.resolve(dirname, path);
  var relative = node_path.relative(options.filebase, resolved);
  return relative;
}
