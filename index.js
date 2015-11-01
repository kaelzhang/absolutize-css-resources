'use strict';

module.exports = absolutize;

var node_url = require('url');
var node_path = require('path');
var async = require('async');
var wrap = require('wrap-as-async');

//                     0           1      2
var REGEX_CSS_IMAGE = /url\s*\(\s*(['"])?([^'"\)]+?)\1\s*\)/ig;

// @param {options}
// - filename: `path`
// - resolve: `function(relative, callback)` the function to resolve relative filename to url
//    - relative `path` the path relative to filebase
// - filebase: `path`
// - allow_absolute_url: `Boolean` default to false
function absolutize (content, options, callback, found_callback) {
  var found = [];

  var match;
  while(match = REGEX_CSS_IMAGE.exec(content)){
    found.push(parse_matched(match));
  }

  var resolve = wrap(options.resolve);

  async.map(found, function (matched, done) {
    var relative_path = matched.match;
    var is_abs = is_absolute(relative_path);

    if (is_abs && !options.allow_absolute_url) {
      return done(new Error('absolute css resources are not allowed: ' + relative_path));
    }

    var parsed_relative = is_abs
      ? relative_path
      : path_relative(relative_path, options);
    found_callback && found_callback(relative_path, parsed_relative);

    resolve(parsed_relative, done);

  }, function (err, result) {
    if (err) {
      return callback(err);
    }

    var reader = 0;
    var parsed = [];

    found.forEach(function(matched, index){
      parsed.push(content.slice(reader, matched.start));
      parsed.push(result[index]);
      reader = matched.end;
    })

    parsed.push(content.slice(reader));

    callback(null, parsed.join(''));
  });
}

// 0      -> url( "a.png" )
// 1      -> "
// 2      -> a.png
// index
// input
function parse_matched (match) {
  var whole_match = match[0];
  var url_match = match[2];
  var start = match.index + whole_match.indexOf(url_match);

  return {
    start: start,
    end: start + url_match.length,
    match: url_match
  };
}


function is_absolute (path) {
  var parsed = node_url.parse(path);
  // 'http://domain.com/a.js'
  return !!parsed.protocol 
    || is_path_absolute(path)
    || false;
}


function is_path_absolute (path) {
  return path.indexOf('/') === 0;
}


function path_relative (path, options) {
  var dirname = node_path.dirname(options.filename);
  var resolved = node_path.resolve(dirname, path);
  var relative = node_path.relative(options.filebase, resolved);
  return relative;
}
