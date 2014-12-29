/* global module */
module.exports = function (grunt, options) {
    'use strict';

    return {
        tasks: {
            "clean:qti": ["build/qti"],
            "less:qti": {
                "files": {
                    "build/qti/css/styles.css": [
                        "src/styles/main.less",
                        "src/elements/**/**.less"
                    ]
                }
            },
            "ngtemplates:qti": {
                "src": "src/elements/*/*.html",
                "dest": ".tmp/qti/templates.js",
                "options": {
                    "url": function (url) {
                        return 'templates/' + url.split('/').pop();
                    },
                    "module": "qti",
                    "htmlmin": {
                        "collapseBooleanAttributes": true,
                        "collapseWhitespace": true,
                        "removeAttributeQuotes": true,
                        "removeComments": true,
                        "removeEmptyAttributes": false,
                        "removeRedundantAttributes": true,
                        "removeScriptTypeAttributes": true,
                        "removeStyleLinkTypeAttributes": true
                    }
                }
            },
            "ngAnnotate:qti": {
                "options": {
                    "singleQuotes": true
                },
                "files": {
                    ".tmp/qti/qti.js": [
                        "src/*.js",
                        "src/behaviors/**/**.js",
                        "src/elements/**/vendor/*.js", // for videogular
                        "src/elements/**/**.js",
                    ]
                }
            },
            "string-replace:qti": {
                files: {'.tmp/qti/qti.js': '.tmp/qti/qti.js'},
                options: {
                    replacements: [
                        { // fix up module declaration - angular.module('qti.plugins.videogular', [])
                            pattern: 'angular.module("com.2fdevs.videogular", ["ngSanitize"])',
                            replacement: 'angular.module("qti.plugins")'
                        },
                        { // fixes up so there is only one module decaration - angular.module('qti.plugins.videogular')
                            pattern: /angular.module\("(com.2fdevs.videogular.*)?\)/gim,
                            replacement: 'angular.module("qti.plugins")'
                        }
                    ]
                }
            },
            "uglify:qti": {
                "options": {
                    "mangle": false,
                    "compress": false,
                    "preserveComments": "none",
                    "beautify": true,
                    "exportAll": true,
                    "banner": '/*\n* <%= name %> <%= version %>\n*/\n'
                },
                "files": {
                    "build/qti/qti.js": [
                        ".tmp/qti/qti.js",
                        '.tmp/qti/templates.js'
                    ]
                }
            },
            "uglify:qti_min": {
                "options": {
                    "report": "min",
                    "wrap": '<%= name %>',
                    "banner": '/*\n* <%= name %> <%= version %>\n*/\n'
                },
                "files": {
                    "build/qti/qti.min.js": [
                        ".tmp/qti/qti.js",
                        '.tmp/qti/templates.js'
                    ]
                }
            },
            "copy:qti_matvideo": {
                "expand": true,
                "cwd": "src/elements/matvideo/styles/",
                "src": ["assets/**", "fonts/**"],
                "dest": "build/qti/css/matvideo"
            }
        }
    };
};