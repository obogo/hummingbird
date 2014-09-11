module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*\n' +
            '* <%= pkg.name %> <%= pkg.version %>\n' +
            '* Obogo. MIT ' + new Date().getFullYear() + '\n' +
            '*/\n',
        jasmine: {
            angular: {
                src: 'build/angular.js',
                options: {
                    specs: 'test/spec/*-spec.js',
                    helpers: 'test/spec/*-helper.js'
                }
            }
        },
        jshint: {
            files: ['src/**/*.js'],
            options: {
                globals: {
                    loopfunc: false
                },
                ignores: [ "src/vendor/D.js" ]
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
                    wrap: '<%= pkg.packageName %>',
                    banner: '<%= banner %>'
                },
                files: {
                    './build/<%= pkg.filename %>.js': [
                        'src/**/_package_.js',
                        'src/helpers/**.js',
                        'src/data/**.js',
                        'src/formatters/**.js',
//                        'src/helpers/__package__.js',
                        '../../src/helpers/__package__.js',
                        '../../src/helpers/each.js',
                        '../../src/formatters/__package__.js',
                        '../../src/formatters/stripLineBreaks.js',
                        '../../src/formatters/stripExtraSpaces.js',
                        '../../src/app/injector.js',
                        '../../src/app/interpolate.js',
                        '../../src/app/errors/__package__.js',
                        '../../src/app/errors/debug.js',
                        'src/validators/**.js',
                        'src/core/**.js'
                    ]
                }
            },
            build_min: {
                options: {
                    wrap: '<%= pkg.packageName %>',
                    banner: '<%= banner %>',
                    report: 'min',
                    exportAll: true
                },
                files: {
                    './build/<%= pkg.filename %>.min.js': [
                        'src/**/_package_.js',
                        'src/data/**.js',
                        'src/formatters/**.js',
                        'src/helpers/**.js',
                        'src/validators/**.js',
                        'src/core/**.js'
                    ]
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jasmine');

    grunt.registerTask('default', ['jshint', 'uglify']);
    grunt.registerTask('integrate', ['jasmine']);
};