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
        belt: {
            options: {
                wrap: 'hb',
                minify: true,
//                polymers: ['array.indexOf', 'date.toISOString'],
                ignores: []
            },
//            build: {
//                files: { './build/belt.js': [ './demo/treeshake-example.js' ] }
//            },
            build: {
                files: { './playground/blast/build/hb.js': [
                    './playground/blast/blast.build'
                ] }
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
                src: ['build/belt-app.js'],
                options: {
                    helpers: '**/*-helper.js',
//                    specs: 'tests/spec/**/*.js'
                    specs: ['tests/spec/hb/hummingbird_spec.js', 'tests/spec/hb/injector_spec.js', 'tests/spec/hb/interpolator_spec.js']
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jasmine');

    grunt.registerTask('default', 'uglify');
    grunt.registerTask('treeshake', 'belt');
    grunt.registerTask('test', 'jasmine');

};