# hummingbird

A micro JavaScript framework similar to AngularJS including a plugin library for common functions and utilities.

##Yet another framework?

Not really. First, we love Angular. However, we don't love that there isn't an formidable way to use Angular to build widgets with a small amount of code. Hummingbird is built around the concept of tree shaking (only including what is referenced vs the entire library). Hummingbird can't act as either a framework or a utility library or both. We are able to achieve this using grunt-treeshake (another open-source library by Obogo). Treeshake is designed to only include the files referenced in a project. 

Hummingbird supports features you know and love with Angular such as directives, data binding, templates and more. It also supports features we wished were in Angular, such as asynchronous loading of modules. Hummingbird also has a directive that allows it to become a first-class citizen to AngularJS permitting events, binding and directives to work hand-in-hand within the Angular environment.

##Getting Started

### Install Hummingbird via Bower

	bower install hb

### Install grunt-treeshake via npm

	npm install grunt-treeshake

Hummingbird is built using grunt-treeshake, allowing you to only include the files you reference in your project. [Visit grunt-treeshake](https://github.com/obogo/grunt-treeshake) for more information. While there is a build file, this file includes all Hummingbird libraries and should only be used for prototyping but not production. Use the treeshake to build only the files you reference in your project.

## Contributing
Hummingbird is maintained by the following developers:

* Rob Taylor <roboncode@gmail.com>
* Wes Jones <cybus10@gmail.com>

## License
Copyright (c) 2014 Obogo. Licensed under the MIT license.
