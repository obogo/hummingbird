//! pattern /(\s|query)\(.*?\)\.last\(/
define('query.last', ['query'], function (query) {
    query.fn.last = function (returnElement) {
        if (this.length) {
            if (returnElement) {
                return this[this.length - 1];
            }
            return query(this[this.length - 1], this.context);
        }
        if (returnElement) {
            return null;
        }
        return query();
    };
});