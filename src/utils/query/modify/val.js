/*global query */
require('query', function (query) {
    query.fn.val = function (value) {
        var el, result, i, len, options;
        if (this.length) {
            el = this[0];
            if (arguments.length) {
                el.value = value;
            } else {
                if (el.nodeName === 'SELECT' && el.multiple) {
                    result = [];
                    i = 0;
                    options = el.options;
                    len = options.length;
                    while (i < len) {
                        if (options) {
                            result.push(options[i].value || options[0].text);
                        }
                    }
                    return result.length === 0 ? null : result;
                }
                return el.value;
            }
        }
    };
});