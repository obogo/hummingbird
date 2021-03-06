Hummingbird - a micro JS framework and library
=========================================================================

## UPDATE 20 Sept 2017: We use this project a lot but here is where we are going with it...

1. The micro-framework part will be deprecated. Even though it comes in at a small 18k minified, we have resolved to using [Vue.js](https://vuejs.org/) in place of the micro-framework part of Hummingbird. We have found Vue provides a more complete solution and is worth the file size difference for the performance gain and community support. Library stays, but micro framework goes.
2. We will be taking the utils we have and deprecating some we have found little use for (still to be determined) and then converting them to an ES6 format so they can be easily used in other projects. Many libraries support ES6 now we have some overlap with these other well supported projects.
3. This project will still exist in its current format and be updated because we do use it with several well maintained projects. It's not going anywhere. The new HB will exist as a library of classes and utils in ES6 under a different branch or repo.

### Now back to our regularly scheduled program...


A micro JavaScript framework similar to AngularJS including a plugin library for common functions and utilities.

> We built hummingbird using treeshaking. It only compiles the functionality you use.

First, we really like AngularJS. However, there isn't a way to use Angular to build widgets with a small amount of code. *Angular's base starts at over 110k minified*. Hummingbird is built around the concept of *treeshaking* (only compiles code that is referenced). Hummingbird can act as either a framework or a library. We are able to achieve this using [grunt-treeshake](https://github.com/obogo/grunt-treeshake) (another open-source project provided by Obogo).

> You can build a fully functional widget or application in less than 20k (minified).

Hummingbird's framework supports a simplified version of directives, data binding, templates, scopes and more. It also supports features we wished were in Angular, such as asynchronous loading and better access to utility functions. Hummingbird also provides a directive that allows it's widgets to become first-class citizens in an Angular application.

> Hummingbird supports directives, data binding, templates, routes, query selections, http and more.

## Documentation

[See online documentation](https://goo.gl/2knF85)

## Getting Started

### Install Hummingbird via npm

This plugin requires Grunt ~0.4.0

If you haven't used Grunt before, be sure to check out the [Getting Started guide](http://gruntjs.com/getting-started), as it explains how to create a Gruntfile as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

	npm install hbjs --save-dev

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

	grunt.loadNpmTasks('compile');

Create a grunt file and start with the following template.

     module.exports = function (grunt) {
          grunt.initConfig({
               compile: {
                    myApp: {
                         options: {
                              scripts: {
                                   wrap: "app",
                                   src: ["src/*.js"],
                                   inspect: ["index.html"],
                                   import: [],
                                   export: []
                              },
                              templates: {
                                   cwd: "src/templates",
                                   src: "*.html"
                              },
                              styles: {
                                   src: "src/styles/*.less",
                              }
                         },
                         filename: "app",
                         build: "build"
                    }
               }
          });

          grunt.loadNpmTasks("hbjs");

          grunt.registerTask("default", "compile");
     };

### Grunt options

#### build

**Type:** String

**Default:** *undefined*

The build directory to output the compile and minified JS file.

	options: {
		sample: {
			build: "myFile"
		}
	}

#### filename

**Type:** String

**Default:** *undefined*

Optional. The name of the file to compile the script to. Will produce a filename.js and filename.min.js. By default the "wrap", will be used as the filename.

	options: {
		sample: {
			filename: "myFile"
		}
	}


### Grunt scripts options

#### exclude

**Type:** Array of definitions

**Default:** *undefined*

Will force ignore definitions and its dependencies from import. You can use either the name of the definition or use a directory with a wildcard. Note: if another file references the same definition, that definition will be imported. If you are excluding a particular definition. 

**Example of excluding a definition**

This will only ignore the "query" definition.

	options: {
		sample: {
			scripts: {
				exclude: ["query"]			
			}
		}
	}

**Example of excluding multiple definitions with a wildcard**

This will ignore all query definitions except "query.css".

	options: {
		sample: {
			scripts: {
				import: ["query.css"],
				exclude: ["query.*"]			
			}
		}
	}


#### export

**Type:** Array of definitions

**Default:** *undefined*

Exposes only the list of definitions to the api. If no list is provided, all definitions using *define()* will be added to the public interface.

	options: {
		sample: {
			scripts: {
				export: ["query"]		
			}
		}
	}
	
#### ignore

**Type:** Array of files or String

**Default:** *undefined*

Will exclude importing definitions from files already containing definition. This helps prevent including the same definitions twice.

	options: {
		sample: {
			scripts: {
				ignore: ["build/base.js"]	
			}
		}
	}

#### import

**Type:** Array of definitions or Definition String

**Default:** *undefined*

There may be times when you want to include a definition that is not referenced in one of supported formats. This option will allow you to include a file or files if using a wildcard whether referenced in source files or not. 

	options: {
		sample: {
			scripts: {
				import: ["utils.validators.*", "utils.ajax.http"]
			}
		}
	}


#### inspect

**Type:** Array of files or String

**Default:** *undefined*

Your applications source files to know what to import into the build. Treeshake will inspect your source and look for references that match any definitions in the treeshake library files.

#### src

**Type:** Array of files or String

**Default:** *undefined*

Additional files to include in treeshake. By default, hummingbird includes the hummingbird framework and utils directories. If you have prepared other files to use treeshake, they may also be included.

#### wrap

**Type:** String

**Default:** Uses the grunt target name

Wraps all of the code in a closure, an easy way to make sure nothing is leaking. For variables that need to be public exports and global variables are made available. The value of wrap is the global variable exports will be available as.

**Example**

	compile: {
            demo: {
                options: {
                     scripts: {
                         wrap: 'myDemo',
                         inspect: ['demo/*.js']
                     }
                },
                files: {
                    'demo/treeshaked_lib.js': ['src/**/*.js']
                }
            }
        }



### Hummingbird as a framework

Coming soon.

### Hummingbird as a library

Coming soon.

### Reasons to use Hummingbird

* No check for scope.$$phase
* Hummingbird core focuses on
	* Data binding
	* Templates
	* Scope
	* Directives
	* Everything else is optional
* Treeshake in only what you use
	* See grunt-treeshake to see all the benefits of this. 
* Has a large range of utilities
* Built in REST api structure
* Mock services for offline and prototyping
* Easy to integrate unit tests
* Route support
* Micro loader < 1k for loading in your external project asynchronously
* Async module loading
* Great for building widgets (small file size)
* Ability to treeshake custom files and libraries
* Take advantage of the browser's built in functionality to reduce file size and increase speed of digests
* Easily replace or enhance any part of Hummingbird
* scope.$ignore (turn on / off watchers)
* Unique directives 
	* hb-directive-repeat
* hb intercept matches on each route so you can easily build mocks.
    * you can use regex, url route patterns, and functions to match both pre and post requests for manipulation.
    * You could just use a function and return true to intercept every pre and post.
    * You can also filter by http method. So you can filter on a GET for a url, but ignore a POST for the exact same Url.

## Contributing
Hummingbird is maintained by the following developers:

* Rob Taylor <roboncode@gmail.com>
* Wes Jones <cybus10@gmail.com>

## License
Copyright (c) 2014 Obogo. Licensed under the MIT license.
