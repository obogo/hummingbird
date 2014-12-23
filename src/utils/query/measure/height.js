// import query.query
require('query', function (query) {
    query.fn.height = function () {
        return this.css('height');
    };
});