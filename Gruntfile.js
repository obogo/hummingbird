module.exports = function (grunt) {

    grunt.loadTasks('tasks');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*\n' +
            '* <%= pkg.name %> v.<%= pkg.version %>\n' +
            '* WebUX. MIT ' + new Date().getFullYear() + '\n' +
            '*/\n',
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
            options: {
                wrap: 'hb',
                minify: true,
//                polymers: ['array.indexOf', 'date.toISOString'],
                ignores: ['scope']
//                ignores: []
            },
//            build: {
//                files: { './build/belt.js': [ './demo/treeshake-example.js' ] }
//            },
//            build: {
//                files: { './playground/blast/build/hb.js': [
//                    './playground/blast/blast.build'
//                ] }
//            },
//            build: {
//                files: { './playground/router/build/hb.js': [
//                    './playground/router/route.build'
//                ] }
//            },
//            build: {
//                files: { './tests/build/hb.js': [
//                    './tests/spec/hb/unit.build'
//                ] }
//            }

            build: {
                files: { './build_files/build.xmlToJson.js': [ './build_files/xmlToJson.build' ] }
            }

        },
        uglify: {
            build: {
                options: {
                    mangle: false,
                    compress: false,
                    preserveComments: 'some',
                    beautify: true,
                    exportAll: true,
                    wrap: 'belt',
                    banner: '<%= banner %>'
                },
                files: {
                    './build/belt-all.js': [
                        'src/**/__package__.js',
                        'src/**/*.js'
                    ]
                }
            },
            build_min: {
                options: {
                    wrap: 'belt',
                    report: 'gzip',
                    banner: '<%= banner %>',
                    exportAll: true
                },
                files: {
                    './build/belt-all.min.js': [
                        'src/**/__package__.js',
                        'src/**/*.js'
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
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jasmine');

    grunt.registerTask('build-all', 'uglify');
    grunt.registerTask('build-treeshake', 'treeshake');
    grunt.registerTask('test', 'jasmine');

};