[![Build Status](https://travis-ci.org/neuron-js/absolutize-css-resources.svg?branch=master)](https://travis-ci.org/neuron-js/absolutize-css-resources)

<!-- [![NPM version](https://badge.fury.io/js/absolutize-css-resources.svg)](http://badge.fury.io/js/absolutize-css-resources)
[![npm module downloads per month](http://img.shields.io/npm/dm/absolutize-css-resources.svg)](https://www.npmjs.org/package/absolutize-css-resources) -->
<!-- [![Dependency Status](https://david-dm.org/neuron-js/absolutize-css-resources.svg)](https://david-dm.org/neuron-js/absolutize-css-resources) -->

# absolutize-css-resources

Converts the links of all css images, fonts and other resources into absolute paths from a css file, and you are free to worry about improper replacement.

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
    return url.resolve('http://mydomain.com/static/', path); 
  }
}, function(err, parsed_content){
  parsed_content;
});
```

##### If we have a css file:

```css
body {
  background: url(img/pic.png)
}
```

Then the `parsed_content` will be:

```css
body {
  background: url(http://mydomain.com/static/to/img/pic.png)
}
```

### absolutize(file_content, options, callback [, callback_on_found])

- **file_content** `String` the content of the css file
- **options** `Object`
  - **filename** `path` the absolute path of the css file
  - **filebase** `path`
  - **resolve** `function(relative_path)` the method to resolve the `relative_path` to an absolute url
    - relative_path the path of each css image or resource which is relative to `filebase` 
  - **allow_absolute_url** `Boolean=true` whether allow absolute url of css images, such as `background: url(/a.png)` which is a bad practice.
- **callback** `function()` the error(if exists) and the parsed content will pass to the callback function.
- **callback_on_found** `function(path, relative_path)=` called if a css resource is found. Optional.
  - **path** the original pathname of the resource
  - **relative_path** the pathname relative to the `filebase`

#### options.resolve(relative_path)

`options.resolve` can be a synchronous method or an asynchronous one by using the common [`this.async()`](https://www.npmjs.com/package/wrap-as-async) style.

Sometimes, we need to invoke an asynchronous process to fetch the version info of a image, querying version from db or digesting md5 from the file content, for example.

```js

// options
{
  resolve: function(relative_path){
    // Turns the method into an async method
    var done = this.async();

    my_method_2_get_md5(relative_path, function(err, md5){
      if (err) {
        return done(err);
      }

      var REGEX_EXTENSION = /\.[a-z0-9]$/i;

      // Inserts md5 string into the path
      relative_path = relative_path.replace(REGEX_EXTENSION, function(match){
        return '-' + md5.slice(0, 7) + match;
      });

      // Converts the relative path into an url,
      // The converted url might be something like:
      // -> http://mydomain.com/static/to/pic-9f9dd65.png
      var resolved = require('url').resolve('http://mydomain.com/static/', relative_path);

      done(null, resolved);
    });
  }
}
```

## License

MIT
