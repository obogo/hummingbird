exports.run = function (grunt, wrap, filename, data) {
    if (data.styles) {
        var less = {
            options: {
                paths: ["**/*.less"],
                strictImports: true,
                syncImport: true
            },
            files: {
                'build/css/widgets.css': [
                    "src/**/*.less"
                ]
            }
        };

        var config = grunt.config.get('less') || {};
        config['hummingbird_style'] = less;
        grunt.config.set('less', config);
        grunt.task.run('less:hummingbird_style');
    }
};