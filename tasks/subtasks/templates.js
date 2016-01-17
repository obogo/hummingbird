var path = require('path');
var strip = require('strip-comments');

function toArray(data) {
    if (typeof data === 'undefined') {
        return [];
    }
    if (data instanceof Array) {
        return data;
    }
    return [data];
}

exports.run = function (grunt, wrap, filename, data) {
    if (data.templates) {
        grunt.task.registerTask('hb-templates', '', function(){
            var templateOptions = toArray(data.templates.files);
            var templateOption;
            var unminifiedBuildFile, minifiedBuildFile;
            var file, fullFilePath, dest;

            if (path.join(data.build, data.filename + '.js')) {
                unminifiedBuildFile = grunt.file.read(path.join(data.build, data.filename + '.js'));
                unminifiedBuildFile = unminifiedBuildFile.replace(/tplUrl(:\s?".*?")/gim, "tpl$1");
            }

            if (path.join(data.build, data.filename + '.min.js')) {
                minifiedBuildFile = grunt.file.read(path.join(data.build, data.filename + '.min.js'));
                minifiedBuildFile = minifiedBuildFile.replace(/tplUrl(:\s?".*?")/gim, "tpl$1");
            }

            for (var i = 0; i < templateOptions.length; i++) {
                templateOption = templateOptions[i];

                var filePaths = grunt.file.expand({
                    cwd: templateOption.cwd
                }, templateOption.src);

                for (var n = 0; n < filePaths.length; n++) {
                    fullFilePath = path.join(templateOption.cwd, filePaths[n]);
                    file = grunt.file.read(fullFilePath);

                    if(!templateOption.dest || (data.templates.options && data.templates.options.minify)) {
                        file = file.split('"').join('\\"');
                        file = strip(file).split('\n').join('').split('\t').join('');
                        file = file.replace(/(\s+)/gim, ' ');
                    }

                    if (templateOption.dest) {
                        dest = path.join(templateOption.dest, filePaths[n]);
                        grunt.file.write(dest, file);
                    } else {
                        if (unminifiedBuildFile) {
                            unminifiedBuildFile = unminifiedBuildFile.split(filePaths[n]).join(file);
                        }

                        if (minifiedBuildFile) {
                            minifiedBuildFile = minifiedBuildFile.split(filePaths[n]).join(file);
                        }
                    }
                }

                if (!templateOption.dest) { // write out embed templates in JS files
                    if (unminifiedBuildFile) {
                        grunt.file.write(path.join(data.build, data.filename + '.js'), unminifiedBuildFile);
                    }

                    if (minifiedBuildFile) {
                        grunt.file.write(path.join(data.build, data.filename + '.min.js'), minifiedBuildFile);
                    }
                }
            }
        });

        grunt.task.run('hb-templates');
    }
};