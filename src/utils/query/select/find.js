/*global query */
utils.query.fn.find = function (selector) {
    if (this.length) {
        return query(selector, this[0]);
    }
    return query();
};