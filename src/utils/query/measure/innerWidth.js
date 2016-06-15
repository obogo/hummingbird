//! pattern /(\s|query)\(.*?\)\.innerWidth\(/
//! import query.css
define('query.innerWidth', ['query'], function (query) {
    query.fn.innerWidth = function () {
        return this.css('innerWidth');
    };
});