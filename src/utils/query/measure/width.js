//! pattern /(\s|query)\(.*?\)\.width\(/
//! import query.css
define('query.width', ['query'], function (query) {
    query.fn.width = function (val) {
        return this.css('width', val);
    };
});