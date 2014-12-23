internal('query.innerWidth', ['query', 'query.css'], function (query) {
    query.fn.innerWidth = function () {
        return this.css('innerWidth');
    };
});