internal('query.width', ['query', 'query.css'], function (query) {
    query.fn.width = function (val) {
        return this.css('width', val);
    };
});