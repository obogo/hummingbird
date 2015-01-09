exports.run = function (grunt, wrap, filename, data) {
    //find all assets directories.
    //put them in the styles path directory under assets.
    if (data.styles) {
        var copy = {
            files: [
                {
                    expand: true,
                    src: ['src/**/*.svg','src/**/*.png','src/**/*.gif','src/**/*.jpg'],
                    dest: 'build/css/',
                    filter: 'isFile',
                    flatten: true
                }
            ]
        };

        var config = grunt.config.get('copy') || {};
        config['hummingbird_copy'] = copy;
        grunt.config.set('copy', config);
        grunt.task.run('copy:hummingbird_copy');
    }
};