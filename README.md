[![Build Status](https://travis-ci.org/neuron-js/absolutize-css-resources.svg?branch=master)](https://travis-ci.org/neuron-js/absolutize-css-resources)

<!-- [![NPM version](https://badge.fury.io/js/absolutize-css-resources.svg)](http://badge.fury.io/js/absolutize-css-resources)
[![npm module downloads per month](http://img.shields.io/npm/dm/absolutize-css-resources.svg)](https://www.npmjs.org/package/absolutize-css-resources) -->
<!-- [![Dependency Status](https://david-dm.org/neuron-js/absolutize-css-resources.svg)](https://david-dm.org/neuron-js/absolutize-css-resources) -->

# absolutize-css-resources

Convert css images and other resources into absolute paths

## Install

```sh
$ npm install absolutize-css-resources --save
```

## Usage

```js
var absolutize = require('absolutize-css-resources');
var url = require('url');

absolutize(file_content, {
  filename: '/path/to/style.css',
  filebase: '/path',
  resolve: function(path){
    return url.resolve('http://yourdomain.com/', path); 
  }
}, function(err, parsed_content){
  parsed_content;
});
```

- file_content `String` the content of the css file
- filename `path` the absolute path of the css file
- filebase `path`
- resolve `function(relative_path)` the method to resolve the `relative_path` to an absolute url
  - `relative_path` the path of each css image or resource which is relative to `filebase` 
- allow_absolute_url `Boolean=true` whether allow absolute url of css images, such as `background: url(/a.png)` which is a bad practice.

## License

MIT
