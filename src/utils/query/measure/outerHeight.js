//! import query.css
internal('query.outerHeight', ['query'], function (query) {
    query.fn.outerHeight = function () {
        return this.css('outerHeight');
    };
});