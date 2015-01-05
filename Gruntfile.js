module.exports = function (grunt) {

    grunt.loadTasks('tasks');

    grunt.initConfig({
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
        treeshake: {
            hb: {
                options: {
                    minify: true,
                    import: [
                        'module',
                    ],
                    report: 'verbose',
                    log: 'logs/hb.log'
                },
                files: {
                    'build/hb.js': ['src/**/*.js']
                }
            },
            utils: {
                options: {
                    minify: true,
                    import: '*',
                    report: 'verbose',
                    log: 'logs/hb-utils.log'
                },
                files: {
                    'build/hb-utils.js': ['src/**/*.js']
                }
            }
        },
        jasmine: {
            tests: {
                src: ['tests/build/hb.js'],
                options: {
                    helpers: '**/*-helper.js',
//                    specs: 'tests/spec/**/*.js'
                    specs: [
                        'tests/spec/hb/bridge_spec.js',
                        'tests/spec/hb/compiler_spec.js',
                        'tests/spec/hb/hummingbird_spec.js',
                        'tests/spec/hb/injector_spec.js',
                        'tests/spec/hb/interpolator_spec.js',
                        'tests/spec/hb/module_spec.js',
                        'tests/spec/hb/router/router_spec.js',
                        'tests/spec/sort_spec.js'
                    ]
                }
            }
        },

        "compile": {
            compile: {
                options: {
                    scripts: {
                        wrap: 'compile',
                        inspect: ['demo/compile/compile.html'],
                        import: ['widgets', 'templates'],
                        src: ['demo/compile/src/**/**.js']
                    },
                    styles: {
                        src: []
                    },
                    templates: {
                        src: []
                    },
                    build: 'demo/compile/build'
                }

                //ngtemplates: {
                //    cwd: 'src/widgets'
                //},
                //treeshake: {
                //    options: {
                //        wrap: 'compile',
                //        inspect: ['demo/compile/compile.html'],
                //        import: ['widgets', 'templates'],
                //    },
                //    files: {
                //        '.hb_tmp/app.js': [
                //            'node_modules/hummingbird/src/**/**.js',
                //            'src/**/**.js',
                //            'demo/compile/src/**/**.js',
                //            '.tmp/app-templates-replaced.js'
                //        ]
                //    }
                //},
                //build: 'demo/compile/build'
            }
        },
        clean: ['.tmpCompile']
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-treeshake');

    grunt.registerTask('hb', 'jshint', 'treeshake');
};