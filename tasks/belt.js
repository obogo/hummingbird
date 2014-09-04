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
    var options;

    function removeComments(str) {
        str = ('__' + str + '__').split('');
        var mode = {
            singleQuote: false,
            doubleQuote: false,
            regex: false,
            blockComment: false,
            lineComment: false,
            condComp: false
        };
        for (var i = 0, l = str.length; i < l; i++) {

            if (mode.regex) {
                if (str[i] === '/' && str[i - 1] !== '\\') {
                    mode.regex = false;
                }
                continue;
            }

            if (mode.singleQuote) {
                if (str[i] === "'" && str[i - 1] !== '\\') {
                    mode.singleQuote = false;
                }
                continue;
            }

            if (mode.doubleQuote) {
                if (str[i] === '"' && str[i - 1] !== '\\') {
                    mode.doubleQuote = false;
                }
                continue;
            }

            if (mode.blockComment) {
                if (str[i] === '*' && str[i + 1] === '/') {
                    str[i + 1] = '';
                    mode.blockComment = false;
                }
                str[i] = '';
                continue;
            }

            if (mode.lineComment) {
                if (str[i + 1] === '\n' || str[i + 1] === '\r') {
                    mode.lineComment = false;
                }
                str[i] = '';
                continue;
            }

            if (mode.condComp) {
                if (str[i - 2] === '@' && str[i - 1] === '*' && str[i] === '/') {
                    mode.condComp = false;
                }
                continue;
            }

            mode.doubleQuote = str[i] === '"';
            mode.singleQuote = str[i] === "'";

            if (str[i] === '/') {

                if (str[i + 1] === '*' && str[i + 2] === '@') {
                    mode.condComp = true;
                    continue;
                }
                if (str[i + 1] === '*') {
                    str[i] = '';
                    mode.blockComment = true;
                    continue;
                }
                if (str[i + 1] === '/') {
                    str[i] = '';
                    mode.lineComment = true;
                    continue;
                }
                mode.regex = true;

            }

        }
        return str.join('').slice(2, -2);
    }

    function loadBelt() {
        if (beltFilesLoaded) {
            return;
        }
        beltFilesLoaded = true;

        // load up all belt source files
        var paths;
        if (grunt.file.exists('node_modules')) {
            paths = grunt.file.expand('node_modules/grunt-belt/src/**');
        } else {
            paths = grunt.file.expand('src/**');
        }

        var filepath;
        for (var e in paths) {
            filepath = paths[e];
            if (filepath.substring(filepath.length - 3) === '.js') {
                var packageName = filepath;
                var lookup = 'src/';
                var index = packageName.indexOf(lookup) + lookup.length;
                var source = grunt.file.read(filepath, { encoding: 'utf8' });
                source = removeComments(source);
                packageName = packageName.split('/').join('.');
                packageName = packageName.toLowerCase();
                packageName = packageName.substr(index);
                packageName = packageName.substr(0, packageName.length - 3);
                packageName = packageName.split('src.').join('');
                packageName = packageName.split('helpers.').join('');
                packages[packageName] = source;
            }
        }
    }

    var parseSource = function (src, deps) {
        deps = deps || [];
        src = removeComments(src);
        var fnName, searchResults = src.match(/((\w+\.)+)\w+/gm) || [];

        var polymers = options.polymers;
        for (var e in polymers) {
            searchResults.push('polymers.' + polymers[e].toLowerCase());
        }

        for (var e in searchResults) {
            fnName = searchResults[e].split('belt.').join('');
            if (!includes[fnName.toLowerCase()] && packages[fnName.toLowerCase()]) {
                includes[fnName.toLowerCase()] = true;
                deps.push(fnName);
                parseSource(packages[fnName.toLowerCase()], deps);
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

    grunt.registerMultiTask('belt', 'Invoking tree shaking', function () {

            loadBelt();

            // Merge task-specific and/or target-specific options with these defaults.
            options = this.options({
                wrap: '',
                minify: false,
                polymers: []
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

                // Write the destination file.
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
