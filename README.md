# belt.js

A compilation of several JavaScript utility libraries with the ability to treeshake files during build.

###This is a developer preview and is currently in a pre-alpha.

## Getting Started

This plugin requires Grunt.

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-belt --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('belt');
```

## The "belt" task

### Overview
In your project's Gruntfile, add a section named `belt` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  belt: {
    options: {
      wrap: '',
      minify: true,
      polymers: ['string.trim']
    },
    your_target: {
      files: { 'PATH_TO_OUTPUT_DIR': [ 'PATHS_TO_SOURCE_FILES' ] }
    },
  },
})
```

### Options

#### options.wrap
Type: `String`
Default value: `""`

Creates a wrapper with the package name provided. Use `wrap` if you would like too use the belt as a standalone file. If you would like to embed the file as part of your source to be compiled, do not wrap the files.

#### options.minify
Type: `String`
Default value: `false`

Will include a minified version of the `wrap` as `belt.min.js`. 

#### options.polymers
Type: `Array`
Default value: `[]`

The treeshaker cannot determin if polymers are used. This array can force polymers to be included if desired. Polymers may or may not be needed depending on your target browsers.

#### options.ignores
Type: `Array`
Default value: `[]`

Provides a list of belt libraries to exclude during the build. Its possible the treeshaker will identify functions you have in code with a name that matches a library item in belt.

### Usage Examples

#### Custom Options

This example shows how to use the `belt` configuration.

```js
grunt.initConfig({
  belt: {
    options: {
        wrap: 'belt',
        minify: true,
        polymers: ['array.indexOf', 'date.toISOString'],
        ignores: ['data.cache', 'patterns.inject']
    },
    build: {
        files: { './build/belt.js': [ './demo/src/*' ] }
    },
  },
})
```

## Contributing
Belt is maintained by the following developers:

* Rob Taylor <roboncode@gmail.com>
* Wes Jones <cybus10@gmail.com>


## License
Copyright (c) 2014 Obogo. Licensed under the MIT license.
