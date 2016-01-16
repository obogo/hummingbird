exports.run = function (grunt, wrap, filename, data) {

    var buildPath = data.build + '/' + filename;
    var buildPathJS = buildPath += '.js';
    var buildPathMinJS = buildPath += '.min.js';

    var files = {};
    files[buildPathJS] = buildPathJS;
    files[buildPathMinJS] = buildPathMinJS;
    var count = 0;
    var cache = {};

    function keygen(pattern) {
        var defaultPattern = 'xxxxxxxx';
        return (pattern || defaultPattern).replace(/[xy]/g, function (b) {
            var d = 16 * Math.random() | 0;
            return ('x' == b ? d : d & 3 | 8).toString(16);
        });
    }

    var prefix = keygen();

    var stringReplace = {
        files: files,
        options: {
            replacements: [
                {
                    pattern: /\.(template)\("(.*?)"/gim,
                    replacement: function(match, p1, p2) {
                        if(!cache[p2]) {
                            cache[p2] = prefix + '_tpl' + count++;
                        }
                        return match.split(p2).join(cache[p2]);
                    }
                },
                {
                    pattern: /tplUrl:\s+("|')(.*?)\1/gim,
                    replacement: function(match, p1, p2) {
                        if(!cache[p2]) {
                            cache[p2] = prefix + '_tpl' + count++;
                        }
                        return match.split(p2).join(cache[p2]);
                    }
                }
            ]
        }
    };

    if (data.templates && data.templates.options && data.templates.options.shortenNames) {
        var config = grunt.config.get('string-replace') || {};
        config['hummingbird_shorten'] = stringReplace;
        grunt.config.set('string-replace', config);
        grunt.task.run('string-replace:hummingbird_shorten');
    }
}
