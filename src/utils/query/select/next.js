//! pattern /\)\.next\(/
internal('query.next', ['query'], function (query) {
    query.fn.next = function () {
        var list = [];
        if (this.length) {
            var node = this[0].nextElementSibling;
            if (node) {
                list.push(node);
            }
            return query(list, this.context);
        }
        return query([], this.context);
    };
});