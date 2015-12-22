module.exports = function (grunt) {

    // load tasks
    require('load-grunt-tasks')(grunt);

    var config = {
        jshint: {
            // define the files to lint
            files: ['src/**/*.js'],
            // configure JSHint (documented at http://www.jshint.com/docs/)
            options: {
                // more options here if you want to override JSHint defaults
                globals: {
                    loopfunc: true
                }
            }
        },
        compile: {
            unittest: {
                banner: "<%= banner %>",
                wrap: 'hb',
                build: 'tests/build',
                filename: 'hb-unittest',
                scripts: {
                    inspect: ['tests/spec/util/**/**.js'],
                    includes: ['tests/helpers/define.js'],
                    src: ['src/**/**.js']
                }
            }
        },
        jasmine: {
            tests: {
                src: ['tests/build/hb-unittest.js'],
                options: {
                    //helpers: '**/*-helper.js',
                    //                    specs: 'tests/spec/**/*.js'
                    specs: [
                        'tests/spec/util/**/*_Spec.js'
                    ]
                }
            },
            spec: {
                src: ['tests/build/hb-unittest.js'],
                options: {
                    //helpers: '**/*-helper.js',
                    //                    specs: 'tests/spec/**/*.js'
                    specs: [
                        'tests/spec/<%= specData.file %>_Spec.js'
                    ]
                }
            }
        },
        jsdoc: {
            dist: {
                src: ['src/utils/ajax/**/*.js'],
                jsdoc: './node_modules/.bin/jsdoc',
                options: {
                    destination: 'doc',
                    //configure: './node_modules/jsdoc/conf.json',
                    //template: './node_modules/ink-docstrap/template'
                }
            }
        },
        "string-replace": {
            unittest: {
                files: {
                    'tests/index.html': 'tests/index.tpl.html'
                },
                options: {
                    replacements: [
                        {
                            pattern: '<!-- ##SPECS## -->',
                            replacement: function () {
                                var files = grunt.file.expand('tests/spec/util/**/*.js');
                                return '<script src="../' + files.join('"></script>\n<script src="../') + '"></script>';
                            }
                        }
                    ]
                }
            }
        }
    };

    grunt.initConfig(config);

    grunt.loadTasks('tasks');
    grunt.loadNpmTasks('grunt-string-replace');

    grunt.registerTask('jshint', ['jshint']);
    grunt.registerTask('default', ['compile:unittest']);
    grunt.registerTask('test', [/*'jshint', */'compile:unittest', 'string-replace:unittest', 'jasmine:tests']);
    grunt.registerTask('docs', ['jsdoc']);
};