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
            demo: {
                options: {
                    scripts: {
                        wrap: 'demo',
                        inspect: ['demo/compile/compile.html'],
                        import: ['widgets', 'templates'],
                        src: ['src/**/**.js', 'demo/compile/src/**/**.js']
                    },
                    styles: {
                        src: []
                    },
                    templates: {
                        src: []
                    },
                    build: 'demo/compile/build'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');

    grunt.registerTask('hb', 'jshint', 'compile');
};