//! pattern /(\s|query)\(.*?\)\.innerHeight\(/
//! import query.css
internal('query.innerHeight', ['query'], function (query) {
    query.fn.innerHeight = function () {
        return this.css('innerHeight');
    };
});