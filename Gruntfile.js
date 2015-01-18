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
                hb: {
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
                    wrap: 'hb',
                    build: 'build',
                    filename: 'hb-utils',
                    scripts: {
                        import: ['utils.*'],
                        src: ['src/utils/**/**.js']
                    }
                },
                services_example: {
                    wrap: 'hb',
                    build: 'demo/rest',
                    filename: 'hb',
                    loader: {
                        url: 'hb.js',
                        api: 'on'
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

    grunt.registerTask('hb', 'jshint', 'compile');
};