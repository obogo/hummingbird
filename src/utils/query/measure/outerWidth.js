/*global query */
require('query', function (query) {
    query.fn.outerWidth = function () {
        return this.css('outerWidth');
    };
});