/**
 * Cleans up all the tmp dirs
 */
exports.run = function (grunt, wrap, filename, data) {
    var clean = ['.tmp_templates', '.tmp_compile', '.tmp_services'];
    var config = grunt.config.get('clean') || {};
    config['hummingbird_clean'] = clean;
    grunt.config.set('clean', config);
    grunt.task.run('clean:hummingbird_clean');
}
