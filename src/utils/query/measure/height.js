internal('query.height', ['query', 'query.css'], function (query) {
    query.fn.height = function () {
        return this.css('height');
    };
});