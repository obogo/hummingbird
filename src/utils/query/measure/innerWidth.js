/*global query */
require('query', function (query) {
    query.fn.innerWidth = function () {
        return this.css('innerWidth');
    };
});