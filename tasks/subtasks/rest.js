/**
 * Create a rest
 */
exports.run = function (grunt, wrap, filename, data) {
    var rest = data.rest;
    if(rest) {
        var path = require('path');
        var restjs, crudifyjs, resourcejs;

        if (grunt.file.exists('./plugins/rest/rest.js')) {
            restjs = grunt.file.read('./plugins/rest/rest.js');
            crudifyjs = grunt.file.read('./plugins/rest/helpers/crudify.js');
            resourcejs = grunt.file.read('./plugins/rest/helpers/resource.js');
        } else {
            var root = path.resolve('node_modules');
            var findPath = root + '/**/hbjs/plugins/rest/rest.js';
            var wrapperPath = grunt.file.expand(findPath).shift().split('rest.js').join('wrapper');
            restjs = grunt.file.read(wrapperPath + '/rest.js');
            crudifyjs = grunt.file.read(wrapperPath + '/helpers/crudify.js');
            resourcejs = grunt.file.read(wrapperPath + '/helpers/resource.js');
        }

        var resources = JSON.stringify(data.rest.resources);
        var str = restjs + '\n' + crudifyjs + '\n' + resourcejs;
        str = str.replace(/!!resources\b/gim, resources);
        str = str.replace(/!!baseUrl\b/gim, rest.baseUrl);
        str = str.replace(/!!withCredentials\b/gim, rest.withCredentials);

        grunt.file.write('.tmp_rest/rest.js', str);
    }
};
