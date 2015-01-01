module.exports = function (grunt) {

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
                        'directives.app',
                        'directives.cloak',
                        'directives.view',
                        'directives.model',
                        'directives.events',
                        'directives.class',
                        'directives.disabled',
                        'directives.ignore',
                        'directives.repeat',
                        'directives.src',
                        'directives.show',
                        'plugins.http',
                        'errors.build'
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
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-treeshake');

    grunt.registerTask('hb', 'jshint', 'treeshake');
};