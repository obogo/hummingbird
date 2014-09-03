/*
 * grunt-belt
 * 
 *
 * Copyright (c) 2014 Rob Taylor <roboncode@gmail.com>
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-uglify');

    var beltFilesLoaded = false;
    var packages = {}; // packages are a list of all the files that are part of belt
    var includes = {}; // includes are libs that are included as part of the build

    function loadBelt() {
        if (beltFilesLoaded) {
            return;
        }
        beltFilesLoaded = true;

        // load up all belt source files
        var paths = grunt.file.expand('node_modules/grunt-belt/src/**');
        var filepath;
        for (var e in paths) {
            filepath = paths[e];
            if (filepath.substring(filepath.length - 3) === '.js') {
                var packageName = filepath;
                var lookup = 'belt/';
                var index = packageName.indexOf(lookup) + lookup.length;
                packageName = packageName.split('/').join('.');
                packageName = packageName.toLowerCase();
                packageName = packageName.substr(index);
                packageName = packageName.substr(0, packageName.length - 3);
                packageName = packageName.split('src.').join('');
                packageName = packageName.split('helpers.').join('');
                packages[packageName] = grunt.file.read(filepath, { encoding: 'utf8' });
            }
        }
    }

    var parseSource = function (src, deps) {
        deps = deps || [];
        var fnName, searchResults = src.match(/((\w+\.)+)\w+/gm);
        for (var e in searchResults) {
            fnName = searchResults[e].split('belt.').join('');
            if (fnName !== searchResults[e]) {
//                console.log('fName', packages[fnName.toLowerCase()]);
                if (!includes[fnName.toLowerCase()] && packages[fnName.toLowerCase()]) {
                    includes[fnName.toLowerCase()] = true;
                    deps.push(fnName);
                    parseSource(packages[fnName.toLowerCase()], deps);
                }
            }
        }
        return deps;
    };

    var sortObj = function (obj, type, caseSensitive) {
        var temp_array = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (!caseSensitive) {
                    key = (key.toLowerCase ? key.toLowerCase() : key);
                }
                temp_array.push(key);
            }
        }
        if (typeof type === 'function') {
            temp_array.sort(type);
        } else if (type === 'value') {
            temp_array.sort(function (a, b) {
                var x = obj[a];
                var y = obj[b];
                if (!caseSensitive) {
                    x = (x.toLowerCase ? x.toLowerCase() : x);
                    y = (y.toLowerCase ? y.toLowerCase() : y);
                }
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        } else {
            temp_array.sort();
        }
        var temp_obj = {};
        for (var i = 0; i < temp_array.length; i++) {
            temp_obj[temp_array[i]] = obj[temp_array[i]];
        }
        return temp_obj;
    };

// Please see the Grunt documentation for more information regarding task
// creation: http://gruntjs.com/creating-tasks
    grunt.registerMultiTask('belt', 'Finds dependencies in the ', function () {

            loadBelt();

            // Merge task-specific and/or target-specific options with these defaults.
            var options = this.options({
                consume: false
            });

            // Iterate over all specified file groups.
            this.files.forEach(function (file) {
                // Concat specified files.
                var src = file.src.filter(function (filepath) {
                    // Warn on and remove invalid source files (if nonull was set).
                    if (!grunt.file.exists(filepath)) {
                        grunt.log.warn('Source file "' + filepath + '" not found.');
                        return false;
                    }

                    return true;

                }).map(function (filepath) {
                    // Read file source.
                    var src = grunt.file.read(filepath);
                    parseSource(src);
                    return src;
                });

                // console.log('packages', packages);
                // Write the destination file.
                var beltSource = '';
                var beltFiles = sortObj(includes);
                var newline = '\n\r\n\r';

                // create declarations first
                var packageName, packageDeclarations = {};

                for (var filename in beltFiles) {
                    packageName = filename.toLowerCase().split('.').shift();
                    if (!packageDeclarations[packageName]) {
                        packageDeclarations[packageName] = true;
                        if (packages[packageName + '.__package__']) {
                            beltSource += packages[packageName + '.__package__'] + newline;
                        }
                    }
                    beltSource += packages[filename] + newline;
                }

                grunt.file.write(file.dest, beltSource);

                if (options.wrap) {
                    var buildFiles = {};
                    buildFiles[file.dest] = file.dest;

                    var buildMinFiles = {};
                    buildMinFiles[file.dest.substr(0, file.dest.length - 3) + '.min.js'] = file.dest;

                    var config = {
                        uglify: {
                            build: {
                                options: {
                                    mangle: false,
                                    compress: false,
                                    preserveComments: 'some',
                                    beautify: true,
                                    exportAll: true,
                                    wrap: options.wrap
                                },
                                files: buildFiles
                            }
                        }
                    };

                    if (options.minify) {
                        config.uglify.build_min = {
                            options: {
                                wrap: options.wrap,
                                exportAll: true
                            },
                            files: buildMinFiles
                        };
                    }

                    grunt.initConfig(config);

                    grunt.task.run('uglify');
                }


                // Print a success message.
                grunt.log.writeln('File "' + file.dest + '" created.');
            });
        }
    );

};
