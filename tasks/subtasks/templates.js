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
                        replacement: "internal('templates_" + i + "', ['" + (data.name || wrap) + "'], function(app) {"
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
    if (data.templates && data.templates.files && data.templates.files.length) {

        var templateOpts = {};
        var templates = toArray(data.templates.files);
        var len = templates.length;
        var i;
        var filesToCopyToDir = [];
        var optCount = 0;
        for (i = 0; i < len; i++) {
            //var opts = { cwd: 'src/go', src: '**/**.html' },
            var opts = templates[i];

            if (opts.dest) {
                opts.expand = true;
                opts.flatten = true;
                opts.filter = 'isFile';
                filesToCopyToDir.push(opts);
            } else {
                optCount += 1;
                templateOpts['template' + i] = {
                    src: [opts.src],
                    cwd: opts.cwd,
                    dest: '.tmp_templates/templates_' + i + '.js',
                    options: {
                        module: data.name || wrap,
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
        }

        if (filesToCopyToDir.length) {
            grunt.config.set('copy', {main:{files:filesToCopyToDir}});
            grunt.task.run('copy:main');
        }

        if (optCount) {// only do this if items were assigned to the ngtemplates
            grunt.config.set('ngtemplates', templateOpts);
            grunt.task.run('ngtemplates');
        }

        runCleanup(grunt, wrap, filename, data, len);
    }
};