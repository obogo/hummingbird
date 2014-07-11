/*global query */
query.fn.append = function (element) {

    if (typeof element === 'string') {
        element = query(element);
    }

    if (element instanceof Array) {
        if (element.length) {
            element = element[0];
        }
    }

    if (element instanceof Element || element instanceof Node) {
        this.each(function (index, el) {
            el.appendChild(element);
        });
    }
};