/*global query */
require('query', function (query) {
    query.fn.innerHeight = function () {
        return this.css('innerHeight');
    };
});