//! pattern /(\s|query)\(.*?\)\.children\(/
internal('query.children', ['query'], function (query) {
    query.fn.children = function () {
        var list = [], i, len;
        this.each(function (index, el) {
            var children = el.children;
            i = 0;
            len = children.length;
            while (i < len) {
                list.push(children[i]);
                i += 1;
            }
        });
        return query(list, this.context);
    };
});