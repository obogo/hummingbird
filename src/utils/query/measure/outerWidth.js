append('query.outerWidth', ['query', 'query.css'], function (query) {
    query.fn.outerWidth = function () {
        return this.css('outerWidth');
    };
});