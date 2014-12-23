/*global query */
require('query', function (query) {
    query.fn.first = function (returnElement) {
        if (this.length) {
            if (returnElement) {
                return this[0];
            }
            return query(this[0]);
        }
        if (returnElement) {
            return null;
        }
        return query();
    };
});