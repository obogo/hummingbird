/**
 * Create a rest services
 */
exports.run = function (grunt, wrap, filename, data) {
    var services = data.services;
    if(services) {
        var path = require('path');
        var servicesjs, crudifyjs, resourcejs;

        if (grunt.file.exists('./plugins/services/services.js')) {
            servicesjs = grunt.file.read('./plugins/services/services.js');
            crudifyjs = grunt.file.read('./plugins/services/helpers/crudify.js');
            resourcejs = grunt.file.read('./plugins/services/helpers/resource.js');
        } else {
            var root = path.resolve('node_modules');
            var findPath = root + '/**/hbjs/plugins/services/services.js';
            var wrapperPath = grunt.file.expand(findPath).shift().split('services.js').join('wrapper');
            servicesjs = grunt.file.read(wrapperPath + '/services.js');
            crudifyjs = grunt.file.read(wrapperPath + '/helpers/crudify.js');
            resourcejs = grunt.file.read(wrapperPath + '/helpers/resource.js');
        }

        var resources = JSON.stringify(data.services.resources);
        var str = servicesjs + '\n' + crudifyjs + '\n' + resourcejs;
        str = str.replace(/!!resources\b/gim, resources);
        str = str.replace(/!!baseUrl\b/gim, services.baseUrl);
        str = str.replace(/!!withCredentials\b/gim, services.withCredentials);

        grunt.file.write('.tmp_services/services.js', str);
    }
};
