/*global query */
query.fn.prepend = function (element) {
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
            if (el.childNodes.length) {
                el.insertBefore(element, el.childNodes[0]);
            } else {
                el.appendChild(element);
            }
        });
    }
};