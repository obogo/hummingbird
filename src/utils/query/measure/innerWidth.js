//! pattern /\)\.innerWidth\(/
//! import query.css
internal('query.innerWidth', ['query'], function (query) {
    query.fn.innerWidth = function () {
        return this.css('innerWidth');
    };
});