append('query.outerHeight', ['query', 'query.css'], function (query) {
    query.fn.outerHeight = function () {
        return this.css('outerHeight');
    };
});