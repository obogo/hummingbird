/*global query */
require('query', function (query) {
    query.fn.empty = function () {
        this.each(function (index, el) {
            el.innerHTML = null;
        });
    };
});