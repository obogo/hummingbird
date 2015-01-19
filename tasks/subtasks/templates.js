var compile_templates_js = '.tmp_templates/*.js';

var toArray = function (data) {
    if (typeof data === 'undefined') {
        return [];
    }
    if (data instanceof Array) {
        return data;
    }
    return [data];
};

var runCleanup = function (grunt, wrap, filename, data, len) {
    var files = {};
    files[compile_templates_js] = [];

    for (var i = 0; i < len; i++) {
        var stringReplace = {
            files: {
                '.tmp_templates/': '.tmp_templates/templates_' + i + '.js'
            },
            options: {
                replacements: [
                    {
                        pattern: /angular\.module\(.*?\{/i,
                        replacement: "internal('templates_" + i + "', ['" + wrap + "'], function(app) {"
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
        };

        var config = grunt.config.get('string-replace') || {};
        config['hb_tpl_' + i] = stringReplace;
        grunt.config.set('string-replace', config);
        grunt.task.run('string-replace:hb_tpl_' + i);
    }
};

exports.run = function (grunt, wrap, filename, data) {
    if (data.templates && data.templates.length) {

        var index = 1;
        var templateOpts = {};
        var templates = toArray(data.templates);
        var len = templates.length;
        var i;
        for (var i = 0; i < len; i++) {
            //var opts = { cwd: 'src/go', src: '**/**.html' },
            var opts = templates[i];

            templateOpts['template' + i] = {
                src: [opts.src],
                cwd: opts.cwd,
                dest: '.tmp_templates/templates_' + i + '.js',
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
            }
        }

        grunt.config.set('ngtemplates', templateOpts);
        grunt.task.run('ngtemplates');

        runCleanup(grunt, wrap, filename, data, len);
    }
};