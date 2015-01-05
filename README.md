# hummingbird

A micro JavaScript framework similar to AngularJS including a plugin library for common functions and utilities.

##Yet another framework?

Not really. First, we really like AngularJS. However, we don't love that there isn't an formidable way to use Angular to build widgets with a small amount of code. Hummingbird is built around the concept of tree shaking (only including what is needed vs the entire library). Hummingbird can't act as either a framework and/or a utility library. We are able to achieve this using grunt-treeshake (another open-source library by [Obogo](http://obogo.io)). Treeshake is designed to only include the files referenced in your project. 

Hummingbird supports features you know and love with Angular such as directives, data binding, templates and more. It also supports features we wished were in Angular, such as asynchronous loading of modules and better access to utility functions. Hummingbird also has a directive that allows it to become a first-class citizen to AngularJS permitting events, binding and directives to work hand-in-hand within an Angular application.

##Getting Started

### Install Hummingbird via npm

	npm install hbjs --save-dev

### Setup Grunt

Create a grunt file and start with the following template.

	module.exports = function (grunt) {
    	grunt.initConfig({
     	   "compile": {
      	      myproject: {
      	          options: {
      	              scripts: {
      	                  wrap: 'app',
      	                  inspect: ['src/app.html'],
      	                  src: ['src/*.js']
      	              },
      	              build: 'build'
      	          }
      	      }
      	  }
    	});

    	grunt.loadNpmTasks('hbjs');

	    grunt.registerTask('app', 'compile');
	};

###Hummingbird as a framework

Coming soon.

###Hummingbird as a library

Coming soon.

## Contributing
Hummingbird is maintained by the following developers:

* Rob Taylor <roboncode@gmail.com>
* Wes Jones <cybus10@gmail.com>

## License
Copyright (c) 2014 Obogo. Licensed under the MIT license.
