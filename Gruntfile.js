module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
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
                    inspect: ['demo/treeshake/includes.js']
                },
                files: {
                    'demo/treeshake/hb.js': ['src/**/*.js']
                }
            }
        },
        uglify: {
            test: {
                options: {
                    report: 'gzip'
                },
                files: {
                    'demo/treeshake/hb.min.js': [
                        'demo/treeshake/hb.js'
                    ]
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

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    //grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-treeshake');

    grunt.registerTask('test', 'jshint', 'treeshake');
};