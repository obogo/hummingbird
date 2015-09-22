//! pattern /(\w+|\))\.first\(/
//! pattern /("|')query\1/
internal('query.first', ['query'], function (query) {
    query.fn.first = function (returnElement) {
        if (this.length) {
            if (returnElement) {
                return this[0];
            }
            return query(this[0], this.context);
        }
        if (returnElement) {
            return null;
        }
        return query();
    };
});