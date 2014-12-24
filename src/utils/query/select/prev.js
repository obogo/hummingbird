append('query.prev', ['query'], function (query) {
    query.fn.prev = function () {
        var list = [];
        this.each(function (index, el) {
            list = list.concat(el.childNodes);
            var node = el.previousElementSibling;
            if (node) {
                list.push(node);
            }
        });
        return query(list);
    };
});