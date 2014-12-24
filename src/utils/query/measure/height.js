append('query.height', ['query', 'query.css'], function (query) {
    query.fn.height = function (val) {
        return this.css('height', val);
    };
});