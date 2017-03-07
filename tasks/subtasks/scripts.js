/**
 * Performs treeshake on JS files
 */
exports.run = function (grunt, wrap, filename, data, banner) {

    var buildPathJS = data.build + '/' + filename + '.js';

    if (data.scripts) {

        var files = {};
        files[buildPathJS] = [
            'node_modules/hbjs/src/**/**.js',
            '.tmp_templates/*.js',
            '.tmp_services/*.js'
        ];

        var treeshake = {
            options: {
                banner: data.banner,
                wrap: wrap,
                minify: true,
                match: function (searchText) {
                    var camelCase = function (str) {
                        return str.replace(/-([a-z])/g, function (g) {
                            return g[1].toUpperCase();
                        });
                    };

                    var results = searchText.match(/(\w+-)+\w+/gim);
                    //console.log('--RESULTS--', results);

                    for (var e in results) {
                        results[e] = camelCase(results[e]);
                    }
                    //console.log('----', results);
                    return results;
                },
                ignore: [],
                inspect: ['.tmp_templates/*.js', '.tmp_services/*.js'],
                export: [],
                exclude: [],
                import: [],
                includes: [],
                report: '',
                log: 'logs/' + filename + '.log'
            },
            files: files
        };


        var scripts = data.scripts;
        var options = treeshake.options;
        if (scripts.inspect) {
            options.inspect = options.inspect.concat(scripts.inspect);
        }
        if (scripts.ignore) {
            options.ignore = options.ignore.concat(scripts.ignore);
        }
        if (scripts.import) {
            options.import = options.import.concat(scripts.import);
        }
        if (scripts.exclude) {
            options.exclude = options.exclude.concat(scripts.exclude);
        }
        if (scripts.export) {
            options.export = options.export.concat(scripts.export);
        }
        if (scripts.report) {
            options.report = scripts.report;
        }
        if (scripts.embedRequire !== undefined) {
            options.embedRequire = scripts.embedRequire;
        }
        if (scripts.includes) {
            options.includes = options.includes.concat(scripts.includes);
        }
        if (scripts.src) {
            files[buildPathJS] = files[buildPathJS].concat(scripts.src);
        }
        if (scripts.ignorePatterns) {
            options.ignorePatterns = options.includes.concat(scripts.ignorePatterns);
        }
        if (scripts.match) {
            options.match = scripts.match;
        }

        var config = grunt.config.get('treeshake') || {};
        config['hummingbird_treeshake'] = treeshake;
        grunt.config.set('treeshake', config);
        grunt.task.run('treeshake:hummingbird_treeshake');
    }
};