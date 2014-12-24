/*global query */
append('query.next', ['query'], function (query) {
    query.fn.next = function () {
        var list = [], i, len;
        this.each(function (index, el) {
            list = list.concat(el.childNodes);
            var node = el.nextElementSibling;
            if (node) {
                list.push(node);
            }
        });
        return query(list);
    };
});