//! pattern /(\w+|\))\.parent\(/
//! pattern /("|')query\1/
internal('query.parent', ['query'], function (query) {
    query.fn.parent = function (selector) {
        if (this.length) {
            var parent = this[0].parentNode;
            if (parent && parent.nodeType !== 11) {
                if (selector) {
                    return query(parent).find(selector);
                }
                return query(parent);
            }
        }
        return query();
    };
});