//! pattern /\)\.outerWidth\(/
//! import query.css
internal('query.outerWidth', ['query'], function (query) {
    query.fn.outerWidth = function () {
        return this.css('outerWidth');
    };
});