//! import query.css
internal('query.width', ['query'], function (query) {
    query.fn.width = function (val) {
        return this.css('width', val);
    };
});