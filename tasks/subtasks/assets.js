exports.run = function (grunt, wrap, filename, data) {
    //find all assets directories.
    //put them in the styles path directory under assets.
    var copy = {files:[]}, config;

    if (data.assets) {
        copy.files = copy.files.concat(data.assets.files);
    }
    
    if (copy.files.length) {
        config = grunt.config.get('copy') || {};
        config['hummingbird_copy'] = copy;
        grunt.config.set('copy', config);
        grunt.task.run('copy:hummingbird_copy');
    }
};