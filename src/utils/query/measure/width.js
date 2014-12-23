internal('query.width', ['query', 'query.css'], function (query) {
    query.fn.width = function () {
        return this.css('width');
    };
});