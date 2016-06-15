//! pattern /(\s|query)\(.*?\)\.outerWidth\(/
//! import query.css
define('query.outerWidth', ['query'], function (query) {
    query.fn.outerWidth = function () {
        return this.css('outerWidth');
    };
});