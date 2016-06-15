//! pattern /(\s|query)\(.*?\)\.outerHeight\(/
//! import query.css
define('query.outerHeight', ['query'], function (query) {
    query.fn.outerHeight = function () {
        return this.css('outerHeight');
    };
});