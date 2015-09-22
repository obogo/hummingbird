module.exports = function (grunt) {

    // load tasks
    require('load-grunt-tasks')(grunt);

    var config = {};

    config.jshint = {
        // define the files to lint
        files: ['src/**/*.js'],
        // configure JSHint (documented at http://www.jshint.com/docs/)
        options: {
            // more options here if you want to override JSHint defaults
            globals: {
                loopfunc: true
            }
        }
    };

    config.compile = {
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
    };

    config.jasmine = {
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
    };

    config.jsdoc = {
        dist: {
            src: ['src/utils/ajax/**/*.js'],
            jsdoc: './node_modules/.bin/jsdoc',
            options: {
                destination: 'doc',
                //configure: './node_modules/jsdoc/conf.json',
                //template: './node_modules/ink-docstrap/template'
            }
        }
    };

    // Bumps the version on certain files, puahses changes and tags package
    // IF YOU TOUCH THIS MAKE SURE YOU KNOW WHAT YOU'RE DOING
    // See "grunt-bump" for more information
    config.bump = {
        options: {
            files: ['package.json'],
            updateConfigs: [],
            commit: true,
            commitMessage: 'Release v%VERSION%',
            commitFiles: ['package.json'],
            createTag: true,
            tagName: 'v%VERSION%',
            tagMessage: 'Version %VERSION%',
            push: true,
            pushTo: 'origin',
            gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
            globalReplace: false,
            prereleaseName: false,
            regExp: false
        }
    };

    grunt.initConfig(config);

    grunt.loadTasks('tasks');

    grunt.registerTask('jshint', ['jshint']);
    grunt.registerTask('test', [/*'jshint', */'compile:unittest', 'jasmine:tests']);
    grunt.registerTask('docs', ['jsdoc']);


    // to use do
    // grunt spec:pathToFile
    // it adds the _Spec.js to each file. and each file starts in the spec/util directory
    grunt.registerTask('spec', 'Runs a task on a specified file', function (fileName) {
        specData.file = fileName;
        grunt.task.run("compile:unittest");// build the unit tests
        grunt.task.run('jasmine:spec');// run that spec.
    });
};