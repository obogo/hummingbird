'use strict';
module.exports = function (grunt) {

    require('grunt-treeshake/tasks/treeshake')(grunt);
    require('grunt-angular-templates/tasks/angular-templates')(grunt);
    require('grunt-contrib-less/tasks/less')(grunt);
    require('grunt-contrib-copy/tasks/copy')(grunt);
    require('grunt-string-replace/tasks/string-replace')(grunt);
    require('grunt-contrib-clean/tasks/clean')(grunt);

    var extend = function (target, source) {
        var args = Array.prototype.slice.apply(arguments), i = 1, len = args.length, item, j;
        var options = this || {};
        while (i < len) {
            item = args[i];
            for (j in item) {
                if (item.hasOwnProperty(j)) {
                    //grunt.log.writeln(j, target[j], Object.prototype.toString.call(target[j]))
                    if (target[j] && typeof target[j] === 'object' && !item[j] instanceof Array) {
                        target[j] = extend.apply(options, [target[j], item[j]]);
                    } else if (item[j] instanceof Array) {
                        target[j] = target[j] || (options && options.arrayAsObject ? {length: item[j].length} : []);
                        if (item[j].length) {
                            target[j] = extend.apply(options, [target[j], item[j]]);
                        }
                    } else if (item[j] && typeof item[j] === 'object') {
                        if (Object.prototype.toString.call(item[j]) === '[object RegExp]') {
                            target[j] = item[j];
                        } else if (options.objectsAsArray && typeof item[j].length === "number") {
                            if (!(target[j] instanceof Array)) {
                                target[j] = [];
                            }
                            target[j] = extend.apply(options, [target[j] || {}, item[j]]);
                        } else {
                            target[j] = extend.apply(options, [target[j] || {}, item[j]]);
                        }
                    } else {
                        target[j] = item[j];
                    }
                }
            }
            i += 1;
        }
        return target;
    };

    function wrapOptions(target, options) {
        var opts = {};
        opts[target] = options;
        return opts;
    }

    grunt.registerMultiTask('compile', 'Optimize files added', function () {
        var target = this.target,
            data = this.data || {options: {}},
            cache = {};

        var wrap = target;
        if (data.options.scripts.wrap) {
            wrap = data.options.scripts.wrap;
        } else if (data.treeshake && data.treeshake.options && data.treeshake.options.wrap) {
            wrap = data.treeshake.options.wrap;
        }
        var defaults = {
            less: {
                options: {
                    paths: ["**/*.less"],
                    strictImports: true,
                    syncImport: true
                },
                files: {
                    'build/css/widgets.css': [
                        "src/**/*.less"
                    ]
                }
            },
            "ngtemplates": {
                src: [
                    '**/*.html'
                ],
                cwd: 'src',
                dest: '.tmp_compile/app-templates.js',
                options: {
                    module: wrap,
                    htmlmin: {
                        collapseBooleanAttributes: true,
                        collapseWhitespace: true,
                        removeAttributeQuotes: true,
                        removeComments: true, // Only if you don't use comment directives!
                        removeEmptyAttributes: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true
                    }
                }
            },
            "string-replace": {
                files: {
                    '.tmp_compile/app-templates-replaced.js': '.tmp_compile/app-templates.js'
                },
                options: {
                    replacements: [
                        {
                            pattern: /angular\.module\(.*?\{/i,
                            replacement: "internal('templates', ['" + wrap + "'], function(app) {"
                        },
                        {
                            pattern: /'use strict';/i,
                            replacement: ''
                        },
                        {
                            pattern: /\$templateCache\.put/gi,
                            replacement: 'app.template'
                        },
                        {
                            pattern: /templates\//gi,
                            replacement: ''
                        },
                        {
                            pattern: /scripts\/directives\//gi,
                            replacement: ''
                        },
                        {
                            pattern: /\.html/gi,
                            replacement: ''
                        },
                        {
                            pattern: /\}\]\);/gim,
                            replacement: '});'
                        }
                    ]
                }
            },
            treeshake: {
                options: {
                    wrap: 'app',
                    minify: true,
                    match: function (searchText) {
                        var camelCase = function (str) {
                            return str.replace(/-([a-z])/g, function (g) {
                                return g[1].toUpperCase();
                            });
                        };

                        var results = searchText.match(new RegExp('(' + wrap + '|app|hb)-[\\w|-]+', 'gim'));
                        //grunt.log.writeln('(' + data.treeshake.options.wrap + '|app|hb)-[\\w|-]+');
                        //console.log('--RESULTS--', results);

                        for (var e in results) {
                            if (results[e].indexOf('hb-') === 0) {
                                results[e] = 'directives.' + camelCase(results[e].replace('hb-', ''));
                            } else {
                                results[e] = camelCase(results[e].replace('app-', wrap + '-'));
                            }
                        }
                        //console.log('----', results);
                        return results;
                    },
                    inspect: [],
                    import: [],
                    report: 'verbose',
                    log: 'logs/' + wrap + '.log'
                },
                files: {
                    '.tmp_compile/app.js': [
                        'node_modules/hbjs/src/**/**.js',
                        '.tmp_compile/app-templates-replaced.js'
                    ]
                }
            },
            "string-replace-treeshake": {
                files: {},
                options: {
                    replacements: [
                        {
                            pattern: /(("|')app\2|app\-)/gim,
                            replacement: function (match) {
                                return match.split('app').join(wrap);
                            }
                        }
                    ]
                }
            },
            copy: {
                files: [
                    {expand: true, cwd: 'src', src: ['**/images/**/*'], dest: 'build'},
                ]
            },
            clean: {}
        };

        var compileOptions = extend(defaults, data);

        // setup from options (overrides all)
        if (compileOptions.options) {
            var opts = compileOptions.options
            if (opts.scripts) {
                var scripts = opts.scripts;
                if (scripts.wrap) {
                    compileOptions.treeshake.options.wrap = wrap;
                }
                if (scripts.inspect) {
                    compileOptions.treeshake.options.inspect = compileOptions.treeshake.options.inspect.concat(scripts.inspect);
                }
                if (scripts.import) {
                    compileOptions.treeshake.options.import = compileOptions.treeshake.options.import.concat(scripts.import);
                }
                if (scripts.src) {
                    compileOptions.treeshake.files['.tmp_compile/app.js'] = compileOptions.treeshake.files['.tmp_compile/app.js'].concat(scripts.src);
                }
            }
            if (opts.templates) {
                var templates = opts.templates;
                if (templates.cwd) {
                    compileOptions.ngtemplates.cwd = templates.cwd;
                }
                if (templates.src) {
                    compileOptions.ngtemplates.src = templates.src;
                }
            }
        }

        // set the build file paths.
        var ts = compileOptions['string-replace-treeshake'];
        grunt.log.writeln(compileOptions.options.build + '/' + compileOptions.treeshake.options.wrap + '.js');
        ts.files[compileOptions.options.build + '/' + wrap + '.js'] = '.tmp_compile/app.js';
        ts.files[compileOptions.options.build + '/' + wrap + '.min.js'] = '.tmp_compile/app.min.js';

        // to look up directives in use for templates.
        compileOptions.treeshake.options.inspect.push('.tmp_compile/app-templates-replaced.js');

        function run(name, options, forceName) {
            var targetName = forceName || target;
            if (!cache[name]) {
                options = wrapOptions(targetName, options);
                cache[name] = options;
            } else {
                cache[name][targetName] = options;
            }
            options = cache[name];
            grunt.config.set(name, options);
            grunt.task.run(name + ':' + targetName);
        }

        if (compileOptions.options.styles && compileOptions.options.styles.src && compileOptions.options.styles.src.length) {
            run('less', compileOptions.less);
        }

        if (compileOptions.options.templates) {
            var templates = compileOptions.options.templates;
            if (templates.src || templates.cwd) {
                run('ngtemplates', compileOptions.ngtemplates);
            }
        }

        run("string-replace", compileOptions["string-replace"]);
        run('treeshake', compileOptions.treeshake);
        run('string-replace', compileOptions['string-replace-treeshake'], 'treeshake');
        run('copy', compileOptions.copy);

        grunt.config.set('clean', {hb_compile: '.tmp_compile'});
        grunt.task.run('clean:hb_compile');
    });
};