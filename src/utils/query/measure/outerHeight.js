/*global query */
require('query', function (query) {
    query.fn.outerHeight = function () {
        return this.css('outerHeight');
    };
});