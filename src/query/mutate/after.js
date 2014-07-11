/*global query */
query.fn.after = function (elements) {
    var parentNode, i;
    if (typeof elements === 'string') {
        elements = query(elements);
    }
    this.each(function (index, el) {
        parentNode = el.parentNode;
        i = elements.length;
        while(i--) {
            parentNode.insertBefore(elements[i].cloneNode(true), el.nextSibling);
        }
    });
};