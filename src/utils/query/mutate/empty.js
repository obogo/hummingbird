//! pattern /(\s|query)\(.*?\)\.empty\(/
define('query.empty', ['query'], function (query) {
    query.fn.empty = function () {
        this.each(function (index, el) {
            el.innerHTML = null;
        });
    };
});