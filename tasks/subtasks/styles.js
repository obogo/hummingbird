exports.run = function (grunt, wrap, filename, data) {
    if (data.styles) {
        var config = grunt.config.get('less') || {};
        config['hummingbird_style'] = data.styles;
        grunt.config.set('less', config);
        grunt.task.run('less:hummingbird_style');
    }
};