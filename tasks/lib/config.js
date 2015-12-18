var _grunt = null;

var compile_templates_js = '.tmp_compile/templates.js';

var getWrap = function (target, data) {
    var wrap = target;
    if (data.wrap) {
        wrap = data.wrap;
    }
    return wrap;
}

var getFilename = function (wrap, data) {
    filename = wrap;
    if (data.filename) {
        filename = data.filename;
    }
    return filename;
}

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



var getStringReplace = function (wrap, data) {

    var files = {};
    files[compile_templates_js] = [];

    var stringReplace = {
        files: files,
        options: {
            replacements: [
                {
                    pattern: /angular\.module\(.*?\{/i,
                    replacement: "internal('templates', ['" + wrap + "'], function(" + wrap + ") {"
                },
                {
                    pattern: /'use strict';/i,
                    replacement: ''
                },
                {
                    pattern: /\$templateCache\.put/gi,
                    replacement: wrap + '.template'
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
    }

    var len = data.ngtemplates;
    for (var i = 0; i < len; i++) {
        stringReplace.files[compile_templates_js].push(data.ngtemplates[i].dest)
    }

    return stringReplace;
}

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
                'node_modules/hbjs/src/**/**.js',
                compile_templates_js
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
}

var getStringTemplateShorten = function (wrap, data) {
    var stringReplace = {
        files: {},
        options: {
            replacements: [
                //{
                //    pattern: /(("|')app\2|app\-)/gim,
                //    replacement: function (match) {
                //        return match.split('app').join(wrap);
                //    }
                //}
                //{
                //    pattern: new RegExp(wrap + '\\.template\\(("|\')\\w+')
                //}
            ]
        }
    }

    return stringReplace;
}

var getCopy = function (wrap, data) {
    var copy = {
        files: [
            {expand: true, cwd: 'src', src: ['**/images/**/*'], dest: 'build'},
        ]
    };
    return copy;
}

var getClean = function (wrap, data) {
    var clean = {};
    return clean;
}

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

    config["string-replace"] = getStringReplace(wrap, data);
    config.treeshake = getTreeshake(wrap, filename, data);
    config["string-replace-shorten"] = getStringTemplateShorten(wrap, data);
    config.copy = getCopy(wrap, data);
    config.clean = getClean(wrap, data);

    return config;
}
