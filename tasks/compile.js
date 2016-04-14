'use strict';
/* global module, require */
module.exports = function (grunt) {

    require('grunt-treeshake/tasks/treeshake')(grunt);
    require('grunt-contrib-copy/tasks/copy')(grunt);
    require('grunt-contrib-clean/tasks/clean')(grunt);

    var config = require('./lib/config');

    grunt.registerMultiTask('compile', 'Optimize files added', function () {
        var target = this.target,
            data = this.data;

        var compileOptions = config.get(target, data);

        if(!data.build) {
            throw new Error('"build" property required.');
        }

        var wrap = compileOptions.wrap;
        var filename = compileOptions.filename;

        require('./subtasks/assets').run(grunt, wrap, filename, data);
        require('./subtasks/scripts').run(grunt, wrap, filename, data);
        require('./subtasks/templates').run(grunt, wrap, filename, data);
        require('./subtasks/services').run(grunt, wrap, filename, data);
        require('./subtasks/loader').run(grunt, wrap, filename, data);
        require('./subtasks/cleanup').run(grunt, wrap, filename, data);
    });
};