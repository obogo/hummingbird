'use strict';
module.exports = function (grunt) {

    require('grunt-treeshake/tasks/treeshake')(grunt);
    require('grunt-angular-templates/tasks/angular-templates')(grunt);
    require('grunt-contrib-less/tasks/less')(grunt);
    require('grunt-contrib-copy/tasks/copy')(grunt);
    require('grunt-string-replace/tasks/string-replace')(grunt);
    require('grunt-contrib-clean/tasks/clean')(grunt);

    var config = require('./lib/config');

    grunt.registerMultiTask('compile', 'Optimize files added', function () {
        var target = this.target,
            data = this.data,
            cache = {};

        var compileOptions = config.get(target, data);

        if(!data.build) {
            throw new Error('"build" property required.');
        }

        var wrap = compileOptions.wrap;
        var filename = compileOptions.filename;
        require('./subtasks/styles').run(grunt, wrap, filename, data);
        require('./subtasks/assets').run(grunt, wrap, filename, data);
        require('./subtasks/templates').run(grunt, wrap, filename, data);
        require('./subtasks/scripts').run(grunt, wrap, filename, data);
        require('./subtasks/templateShorten').run(grunt, wrap, filename, data);
        require('./subtasks/cleanup').run(grunt, wrap, filename, data);
    });
};