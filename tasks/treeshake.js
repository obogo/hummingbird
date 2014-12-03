/*
 * grunt-treeshaker
 *
 *
 * Copyright (c) 2014 Rob Taylor <roboncode@gmail.com>
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
//TODO: need to jshint the files before treeshaking. missing ; will it to cause break.
    grunt.loadNpmTasks('grunt-contrib-uglify');

    var options;
    var packages = {}; // packages are a list of all the files that are part of belt
    var includes = {}; // includes are libs that are included as part of the build
    var regExp = null;

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (value) {
            var i = 0, len = this.length, item;
            while (i < len) {
                if (value === this[i]) return i;
                i += 1;
            }
            return -1;
        };
    }


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
        if (regExp) {
            return;
        }

        // load up all belt source files
        var paths;
        if (grunt.file.exists('node_modules/grunt-belt')) {
            paths = grunt.file.expand('node_modules/grunt-belt/src/**');
        } else {
            paths = grunt.file.expand('src/**');
        }

        var filepath, packageList = [];
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
                packageName = packageName.split('platform.').join('');
//                packageName = packageName.split('helpers.').join('');
//                console.log('@@@@@', packageName);
                packages[packageName] = source;

//                options.ignores.push('ready');
//                options.ignores.push('start');

                if (options.ignores.length) {
                    if (options.ignores.indexOf(packageName) === -1) {
                        packageList.push(packageName);
                    }
                } else {
                    packageList.push(packageName);
                }
            }
        }

        regExp = new RegExp('(\\b' + packageList.join('\\b|\\b').split('.').join('\\.') + '\\b)', 'gim');
    }

    var parseSource = function (src, deps) {
        deps = deps || [];

        // remove comments so no to parse dependencies from comments
        src = removeComments(src);

        var fnName, searchResults = src.match(regExp) || [];

        for (var e in searchResults) {
            fnName = searchResults[e];
            if (!includes[fnName.toLowerCase()]) {
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

    grunt.registerMultiTask('treeshake', 'Invoking tree shaking', function () {

            var target = this.target;
            // Merge task-specific and/or target-specific options with these defaults.
            options = { wrap: '', minify: false, polymers: [], ignores: [] };
            for(var i in this.data.options) {
                if (this.data.options.hasOwnProperty(i)) {
                    options[i] = this.data.options[i];
                }
            }

            // Load all the belt source files, build up list of available resources
            loadBelt();


            // Add any polymers to dependencies
            var polymers = options.polymers || [];
            for (var e in polymers) {
                includes['polymers.' + polymers[e].toLowerCase()] = true;
            }

            // Iterate over all specified file groups.
            this.files.forEach(function (file) {

                var src = file.src.filter(function (filepath) {
                    // Warn on and remove invalid source files (if nonull was set).
                    if (!grunt.file.exists(filepath)) {
                        grunt.log.warn('Source file "' + filepath + '" not found.');
                        return false;
                    }

                    return true;

                }).map(function (filepath) {
                    // Read file source.
                    return grunt.file.read(filepath);
                });

                // parse source and find dependencies
                // this creates a list of includes[]
                parseSource(src);

                var beltSource = '';
                var beltFiles = sortObj(includes);
                var newline = '\n\r';

                // create declarations first
                var p1, packageName, packageNameList, packageDeclarations = {};

//                beltSource += packages['utils.__package__'] + newline;
                for (var filename in beltFiles) {
                    // TODO: Fix this hb. hard-coded
                    p1 = filename.toLowerCase().split('hb.').join('').split('.');
                    var pName = '';
                    while(p1.length) {
                        pName += p1.shift() + '.';
                        if (!packageDeclarations[pName + '__package__']) {
                            packageDeclarations[pName + '__package__'] = true;
                            if (packages[pName + '__package__']) {
                                beltSource += packages[pName + '__package__'] + newline;
                            } else {
//                                console.log('DOES NOT EXIST -- ' + pName + '__package__');
                            }
                        };
                    }
                    beltSource += packages[filename] + newline;
                }

//                beltSource = packages['ready'] + beltSource + newline;
//                beltSource += packages['start'] + newline;

                // Write the destination file.
                grunt.file.write(file.dest, beltSource);

                if (options.wrap) {
                    var buildFiles = {};
                    buildFiles[file.dest] = file.dest;

                    var buildMinFiles = {};
                    buildMinFiles[file.dest.substr(0, file.dest.length - 3) + '.min.js'] = file.dest;
                    var uglify = grunt.config.get('uglify') || {};
                    uglify[target] = {
                        options: {
                            mangle: false,
                            compress: false,
                            preserveComments: 'some',
                            beautify: true,
                            exportAll: true,
                            wrap: options.wrap
                        },
                        files: buildFiles
                    };

                    if (options.minify) {
                        uglify[target + '_min'] = {
                            options: {
                                report: 'gzip',
                                wrap: options.wrap,
                                exportAll: true
                            },
                            files: buildMinFiles
                        };
                    }

                    grunt.config.set('uglify', uglify);
                    grunt.task.run('uglify:' + target);
                    grunt.task.run('uglify:' + target + '_min');
                }

                // Print a success message.
                grunt.log.writeln('File "' + file.dest + '" created.');
            });
        }
    );

};