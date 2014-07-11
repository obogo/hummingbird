/*global query */
query.fn.offset = function () {
    if (this.length) {
        return this[0].getBoundingClientRect();
    }
};