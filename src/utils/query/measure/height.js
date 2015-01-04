//! import query.css
internal('query.height', ['query'], function (query) {
    query.fn.height = function (val) {
        return this.css('height', val);
    };
});