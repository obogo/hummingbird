'use strict';
module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    var options,
        header = grunt.file.read('tasks/treeshake2/header.js'),
        footer = grunt.file.read('tasks/treeshake2/footer.js');

    /**
     * Remove comments from string to prevent accidental parsing
     * @param str
     * @returns {string}
     */
    function removeComments(str) {
        str = str.split('');
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
        return str.join('');
    }

    /**
     * Build up all of the packages provided from the config.
     * @param {Object} files
     * @returns {{}}
     */
    function buildPackages(files) {
        var packages = {}, len, j, path, name;
        for (var i in files) {
            len = files[i].src.length;
            for (j = 0; j < len; j += 1) {
                path = files[i].src[j];
                if (path.indexOf('__package__') === -1) {
                    name = path.split('/').pop();
                    name = name.split('.');
                    name.pop();
                    name = name.join('.');
                    packages[name] = path;
                }
            }
        }
        return packages;
    }

    /**
     * Filter out any paths that do not exist in the packages
     * as long as there is no dependency reference.
     * @param {Array} paths
     * @param {Object} packages
     * @returns []
     */
    function filter(paths, packages, wrap) {
        var result = [], i, dependencies = {}, len = paths.length;
        paths = grunt.file.expand(paths);
        for (i = 0; i < len; i += 1) {
            //grunt.log.writeln(paths[i]);
            findDependencies(paths[i], packages, dependencies, wrap);
        }
        for(i in dependencies) {
            if(dependencies.hasOwnProperty(i)) {
                grunt.log.writeln("\t" + dependencies[i].green);
                result.push(dependencies[i]);
            }
        }
        return result;
    }

    function findDependencies(path, packages, dependencies, wrap) {
        var contents = grunt.file.read(path);
        contents = removeComments(contents);
        var i, len, match,
            rx = new RegExp('(' + wrap + '\\.\\w+\\(|(define|require)([\\W\\s]+(("|\')\\w+\\5))+)', 'gim'),
            keys = contents.match(rx), split,
            len = keys && keys.length || 0;
        // now we need to clean up the keys.
        grunt.log.writeln("keys", keys);
        for(i = 0; i < len; i += 1) {
            if (keys[i].indexOf(',') !== -1) {
                split = keys[i].split(',');
                keys = keys.concat(split);
                len = keys.length;
            } else {
                keys[i] = keys[i].split('.').pop();
                keys[i] = keys[i].replace(/(require|define)/gi, '');
                //grunt.log.writeln("keys", keys);
                keys[i] = keys[i].replace(/\W+/g, '');
            }
        }
        grunt.log.writeln("keys", keys);
        if (keys) {
            len = keys.length;
            for(i = 0; i < len; i += 1) {
                match = packages[keys[i]];
                if (match && !dependencies[keys[i]]) {
                    dependencies[keys[i]] = match;
                    grunt.log.writeln("find dependencies in", match);
                    findDependencies(match, packages, dependencies, wrap);
                }
            }
            //grunt.log.writeln(JSON.stringify(dependencies, null, 2));
            return dependencies;// dependencies
        }
    }

    function writeSources(files, dest) {
        // first we put our header on there for define and require.
        var str = header, i = 0, len = files.length;
        for(i = 0; i < len; i += 1) {
            str += grunt.file.read(files[i]);
        }
        str += footer;
        grunt.file.write(dest, str);
    }

    function writeFiles(dest, files, options, target) {
        grunt.log.writeln("output", dest.blue);
        if (options.wrap) {
            var buildFiles = {};
            buildFiles[dest] = files;

            var buildMinFiles = {};
            buildMinFiles[dest.substr(0, dest.length - 3) + '.min.js'] = dest;
            var uglify = grunt.config.get('uglify') || {};
            uglify[target] = {
                options: {
                    mangle: false,
                    compress: false,
                    preserveComments: 'some',
                    beautify: true,
                    exportAll: false,
                    wrap: options.wrap
                },
                files: buildFiles
            };

            if (options.minify) {
                uglify[target + '_min'] = {
                    options: {
                        report: 'gzip',
                        wrap: options.wrap,
                        exportAll: false
                    },
                    files: buildMinFiles
                };
            }

            grunt.config.set('uglify', uglify);
            grunt.task.run('uglify:' + target);
            if (options.minify) {
                grunt.task.run('uglify:' + target + '_min');
            }
        }
    }

    grunt.registerMultiTask('treeshake2', 'Optimize files added', function () {
        var target = this.target,
            packages,
            files;
        // Merge task-specific and/or target-specific options with these defaults.
        options = {
            wrap: '',
            minify: false,
            polymers: [],
            ignores: []
        };
        for (var i in this.data.options) {
            if (this.data.options.hasOwnProperty(i)) {
                options[i] = this.data.options[i];
            }
        }
        // we build the whole package structure. We will filter it out later.
        packages = buildPackages(this.files);
        grunt.log.writeln("including:");
        files = filter(this.data.build, packages);
        // generate file.
        //grunt.log.writeln(files);
        writeSources(files, '.tmp.js');
        writeFiles(this.files[0].dest, ['.tmp.js'], options, target);
    });
};