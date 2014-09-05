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
                wrap: 'obogo',
                minify: true,
//                polymers: ['array.indexOf', 'date.toISOString'],
                ignores: ['data.cache', 'patterns.inject']
            },
//            build: {
//                files: { './build/belt.js': [ './demo/treeshake-example.js' ] }
//            },
            build: {
                files: { './build/belt-app.js': [ './demo/app/build.js' ] }
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
                        'src/ready.js',
                        'src/**/__package__.js',
                        'src/**/*.js',
                        'src/start.js'
                    ]
                }
            },
            build_min: {
                options: {
                    wrap: 'belt',
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
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', 'uglify');
    grunt.registerTask('treeshake', 'belt');

};