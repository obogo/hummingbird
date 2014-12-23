internal('query.height', ['query', 'query.css'], function (query) {
    debugger;
    query.fn.height = function () {
        return this.css('height');
    };
});