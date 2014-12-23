/*global query */
require('query', function (query) {
    query.fn.width = function () {
        return this.css('width');
    };
});