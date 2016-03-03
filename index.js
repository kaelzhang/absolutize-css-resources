'use strict'

module.exports = absolutize

var node_url = require('url')
var node_path = require('path')
var async = require('async')
var wrap = require('wrap-as-async')
var chalk = require('chalk')
var code = require('print-code')

//                     0           1      2
var REGEX_CSS_IMAGE = /url\s*\(\s*(['"])?([^'"\)]+?)\1\s*\)|\n/ig

// @param {options}
// - filename: `path`
// - resolve: `function(relative, callback)` the function to resolve relative filename to url
//    - relative `path` the path relative to filebase
// - filebase: `path`
// - allow_absolute_url: `Boolean` default to false
function absolutize (content, options, callback, found_callback) {
  content = String(content)

  var line_count = 1
  var line = {
    line: line_count,
    index: 0
  }
  var lines = [line]

  var found = []
  var match

  while(match = REGEX_CSS_IMAGE.exec(content)){
    if (match[0] === '\n') {
      line = {
        line: ++ line_count,
        index: match.index
      }
      lines.push(line)
      continue
    }

    found.push(parse_matched(match, line))
  }

  var resolve = wrap(options.resolve)

  async.map(found, function (matched, done) {
    var relative_path = matched.match
    var is_base64 = relative_path.indexOf('data:') === 0
    var is_abs = !is_base64 && is_absolute(relative_path)

    if (is_abs && !options.allow_absolute_url) {
      var err = new Error(
        'absolute css resources "'
        + chalk.cyan(relative_path)
        + '" are not allowed at "'
        + options.filename + '"'
      )

      err = format_exception(err, content, matched)
      return done(err)
    }

    var parsed_relative = is_base64
      ? relative_path
      : is_abs
        ? relative_path
        : path_relative(relative_path, options)

    found_callback && found_callback(relative_path, parsed_relative)

    if (is_base64) {
      return done(null, parsed_relative)
    }

    resolve(parsed_relative, done)

  }, function (err, result) {
    if (err) {
      return callback(err)
    }

    var reader = 0
    var parsed = []

    found.forEach(function(matched, index){
      parsed.push(content.slice(reader, matched.start))
      parsed.push(result[index])
      reader = matched.end
    })

    parsed.push(content.slice(reader))

    callback(null, parsed.join(''))
  })
}


var MAX_COLUMNS = 78

function format_exception (err, content, matched) {
  var start = Math.max(0, matched.line - 3)
  var end = matched.line + 3

  var message = code(content)
    .slice(start, end)
    .max_columns(MAX_COLUMNS)
    .highlight(matched.line)
    .arrow_mark(matched.line, matched.column)
    .get()

  err.message = err.message + '\n\n' + message + '\n'
  return err
}


// 0      -> url( "a.png" )
// 1      -> "
// 2      -> a.png
// index
// input
function parse_matched (match, line) {
  var whole_match = match[0]
  var url_match = match[2]
  var start = match.index + whole_match.indexOf(url_match)

  return {
    start: start,
    end: start + url_match.length,
    match: url_match,
    line: line.line,
    column: start - line.index
  }
}


function is_absolute (path) {
  var parsed = node_url.parse(path)
  // 'http://domain.com/a.js'
  return !!parsed.protocol 
    || is_path_absolute(path)
    || false
}


function is_path_absolute (path) {
  return path.indexOf('/') === 0
}


function path_relative (path, options) {
  var dirname = node_path.dirname(options.filename)
  var resolved = node_path.resolve(dirname, path)
  var relative = node_path.relative(options.filebase, resolved)
  return relative
}
