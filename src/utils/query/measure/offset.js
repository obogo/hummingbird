//! pattern /(\s|query)\(.*?\)\.offset\(/
define('query.offset', ['query'], function (query) {
    query.fn.offset = function () {
        if (this.length) {
            return this[0].getBoundingClientRect();
        }
    };
});