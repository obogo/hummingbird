/*global query */
//! pattern /(\s|query)\(.*?\)\.prop\(/
define('query.prop', ['query'], function (query) {
    query.fn.prop = function (name, value) {
        if (this.length) {
            if (arguments.length > 2) {
                this[0][name] = value;
            } else {
                return this[0][name];
            }
        }
    };

    query.fn.is = function (name) {
        name = name.split(':').join('');
        return this.prop(name);
    };
});