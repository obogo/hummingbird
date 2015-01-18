/**
 * Create a rest loader
 */
exports.run = function (grunt, wrap, filename, data) {
    var loader = data.loader;
    if(loader) {
        var path = require('path');
        var loaderjs;

        if (grunt.file.exists('./plugins/loader/loader.js')) {
            loaderjs = grunt.file.read('./plugins/loader/loader.js');
        } else {
            var root = path.resolve('node_modules');
            var findPath = root + '/**/hbjs/plugins/loader/loader.js';
            var wrapperPath = grunt.file.expand(findPath).shift().split('loader.js').join('');
            loaderjs = grunt.file.read(wrapperPath + '/loader.js');
        }

        var str = loaderjs;
        str = str.replace(/@@namespace\b/gim, wrap);
        str = str.replace(/@@methods\b/gim, loader.api);
        str = str.replace(/@@url\b/gim, loader.url);

        grunt.file.write(data.build + '/loader2.js', str);
    }
};
