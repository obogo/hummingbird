/*global query */
query.fn.last = function (returnElement) {
    if (this.length) {
        if (returnElement) {
            return this[this.length - 1];
        }
        return query(this[this.length - 1]);
    }
    if (returnElement) {
        return null;
    }
    return query();
};