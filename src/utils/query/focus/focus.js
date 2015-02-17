//! pattern /("|')query\1/
internal('query.focus', ['query'], function (query) {
    query.fn.focus = function (val) {
        this.each(function (index, el) {
            el.focus();
        });
        return this;
    };
});