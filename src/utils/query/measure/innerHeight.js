//! pattern /(\s|query)\(.*?\)\.innerHeight\(/
//! import query.css
define('query.innerHeight', ['query'], function (query) {
    query.fn.innerHeight = function () {
        return this.css('innerHeight');
    };
});