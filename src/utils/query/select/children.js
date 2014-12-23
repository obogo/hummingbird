/*global query */
require('query', function (query) {
    query.fn.children = function () {
        var list = [], i, len;
        this.each(function (index, el) {
            list = list.concat(el.childNodes);
            var nodes = el.childNodes;
            i = 0;
            len = nodes.length;
            while (i < len) {
                list.push(nodes[i]);
                i += 1;
            }
        });
        return query(list);
    };
});
