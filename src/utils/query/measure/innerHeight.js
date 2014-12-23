internal('query.innerHeight', ['query', 'query.css'], function (query) {
    query.fn.innerHeight = function () {
        return this.css('innerHeight');
    };
});