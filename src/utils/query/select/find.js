/*global query */
internal('query.find', ['query'], function (query) {
    query.fn.find = function (selector) {
        if (this.length) {
            return query(selector, this[0]);
        }
        return query();
    };
});