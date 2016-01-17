var _grunt = null;

var getWrap = function (target, data) {
    var wrap = target;
    if (data.wrap) {
        wrap = data.wrap;
    }
    return wrap;
};

var getFilename = function (wrap, data) {
    var filename = wrap;
    if (data.filename) {
        filename = data.filename;
    }
    return filename;
};

var getLess = function (wrap, data) {
    // less
    var less = {
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
    };

    return less;
};

var getTreeshake = function (wrap, filename, data) {
    var treeshake = {
        options: {
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
                    if (results[e].indexOf('hb-') === 0) {
                        results[e] = 'hbd.' + camelCase(results[e].replace('hb-', ''));
                    } else {
                        results[e] = camelCase(results[e]);
                    }
                }
                //console.log('----', results);
                return results;
            },
            ignore: [],
            inspect: [],
            export: [],
            exclude: [],
            import: [],
            report: 'verbose',
            log: 'logs/' + filename + '.log'
        },
        files: {
            '.tmp_compile/app.js': [
                'node_modules/hbjs/src/**/**.js'
            ]
        }
    };

    var scripts = data.scripts || {};
    if (scripts.inspect) {
        treeshake.options.inspect = treeshake.options.inspect.concat(scripts.inspect);
    }
    if (scripts.ignore) {
        treeshake.options.ignore = treeshake.options.ignore.concat(scripts.ignore);
    }
    if (scripts.import) {
        treeshake.options.import = treeshake.options.import.concat(scripts.import);
    }
    if (scripts.exclude) {
        treeshake.options.exclude = treeshake.options.exclude.concat(scripts.exclude);
    }
    if (scripts.export) {
        treeshake.options.export = treeshake.options.export.concat(scripts.export);
    }
    if (scripts.src) {
        treeshake.files['.tmp_compile/app.js'] = treeshake.files['.tmp_compile/app.js'].concat(scripts.src);
    }
    return treeshake;
};

var getCopy = function (wrap, data) {
    return {
        files: [
            {expand: true, cwd: 'src', src: ['**/images/**/*'], dest: 'build'},
        ]
    };
};

var getClean = function (wrap, data) {
    return {};
};

exports.init = function(grunt) {
    _grunt = grunt;
};

exports.get = function (target, data) {
    var config = {};
    var wrap = getWrap(target, data);
    var filename = getFilename(wrap, data);

    config.wrap = wrap;
    config.filename = filename;
    config.less = getLess(wrap, data);
    config.treeshake = getTreeshake(wrap, filename, data);
    config.copy = getCopy(wrap, data);
    config.clean = getClean(wrap, data);

    return config;
};
