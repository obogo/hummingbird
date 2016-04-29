//! pattern /(\s|query)\(.*?\)\.prev\(/
internal('query.prev', ['query'], function (query) {
    query.fn.prev = function () {
        var list = [];
        if (this.length) {
            var node = this[0].previousElementSibling;
            if (node) {
                list.push(node);
            }
            return query(list, this.context);
        }
        return query([], this.context);
    };
});