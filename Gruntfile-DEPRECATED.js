module.exports = function (grunt) {

    grunt.loadTasks('tasks');

    var specData = {file:''};
    grunt.initConfig({
            pkg: grunt.file.readJSON('package.json'),
            banner: '/*\n' +
            '* <%= pkg.fullName %> v.<%= pkg.version %>\n' +
            '* Obogo - MIT ' + new Date().getFullYear() + '\n' +
            '* https://github.com/obogo/hummingbird/\n' +
            '*/\n',
            specData: specData,
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
            "compile": {
                hb: {
                    banner: "<%= banner %>",
                    wrap: 'hb',
                    build: 'build',
                    filename: 'hb',
                    scripts: {
                        import: ['hb.*'],
                        src: ['src/**/**.js']
                    },
                    rest: {
                        "baseUrl": "http://localhost:3000/v1",
                        "withCredentials": true,
                        "resources": [
                            {
                                "methods": {
                                    "login": {
                                        "type": "POST",
                                        "url": "/session/login"
                                    },
                                    "logout": {
                                        "type": "GET",
                                        "url": "/session/logout"
                                    },
                                    "getAuthUser": {
                                        "type": "GET",
                                        "url": "/session/me"
                                    },
                                    "getIP": {
                                        "type": "GET",
                                        "url": "//api.ipify.org?format=jsonp"
                                    },
                                    "getInvitee": {
                                        "type": "GET",
                                        "url": "sites/invite/:id"
                                    },
                                    "getContactsDay0": {
                                        "type": "GET",
                                        "url": "contacts/new"
                                    },
                                    "getContactsDay1": {
                                        "type": "GET",
                                        "url": "contacts/yesterday"
                                    },
                                    "getContactsRecent": {
                                        "type": "GET",
                                        "url": "contacts/recent"
                                    },
                                    "getContactsSlipping": {
                                        "type": "GET",
                                        "url": "contacts/slipping"
                                    }
                                }
                            },
                            {
                                "name": "persons"
                            },
                            {
                                "name": "sites"
                            },
                            {
                                "name": "visitors",
                                "methods": "get update"
                            }
                        ]
                    }
                },
                utils: {
                    banner: "<%= banner %>",
                    wrap: 'hb',
                    build: 'build',
                    filename: 'hb-utils',
                    scripts: {
                        import: ['utils.*'],
                        src: ['src/utils/**/**.js']
                    }
                },
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
                },
                services_example: {
                    banner: "<%= banner %>",
                    wrap: 'hb',
                    build: 'demo/rest',
                    filename: 'hb',
                    loader: {
                        url: 'hb.js',
                        api: 'init on'
                    },
                    scripts: {
                        src: ['src/**/**.js']
                    },
                    services: {
                        "baseUrl": "http://localhost:63342/v1",
                        "withCredentials": true,
                        "resources": [
                            {
                                "methods": {
                                    "login": {
                                        "type": "POST",
                                        "url": "/session/login"
                                    },
                                    "logout": {
                                        "type": "GET",
                                        "url": "/session/logout"
                                    },
                                    "getAuthUser": {
                                        "type": "GET",
                                        "url": "/session/me"
                                    },
                                    "getIP": {
                                        "type": "GET",
                                        "url": "//api.ipify.org?format=jsonp"
                                    },
                                    "getInvitee": {
                                        "type": "GET",
                                        "url": "sites/invite/:id"
                                    },
                                    "getContactsDay0": {
                                        "type": "GET",
                                        "url": "contacts/new"
                                    },
                                    "getContactsDay1": {
                                        "type": "GET",
                                        "url": "contacts/yesterday"
                                    },
                                    "getContactsRecent": {
                                        "type": "GET",
                                        "url": "contacts/recent"
                                    },
                                    "getContactsSlipping": {
                                        "type": "GET",
                                        "url": "contacts/slipping"
                                    }
                                }
                            },
                            {
                                "name": "persons"
                            },
                            {
                                "name": "sites"
                            },
                            {
                                "name": "visitors",
                                "methods": "get update"
                            }
                        ]
                    }
                }
            }
        }
    );

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-jasmine');

    grunt.registerTask('hb', [/* 'jshint',*/ 'compile']);
    grunt.registerTask('test', [/*'jshint', */'compile:unittest', 'jasmine:tests']);

    // to use do
    // grunt spec:pathToFile
    // it adds the _Spec.js to each file. and each file starts in the spec/util directory
    grunt.registerTask('spec', 'Runs a task on a specified file', function (fileName) {
        specData.file = fileName;
        grunt.task.run("compile:unittest");// build the unit tests
        grunt.task.run('jasmine:spec');// run that spec.
    });
};