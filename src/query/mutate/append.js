/*global query */
/**
 *
 * @param elements
 * @ref http://ejohn.org/blog/dom-insertadjacenthtml/
 */
query.fn.append = function (elements) {
    var parentNode, i, len;
    if (typeof elements === 'string') {
        elements = query(elements);
    }
    this.each(function (index, el) {
        parentNode = el.parentNode;
        i = 0;
        len = elements.length;
        while (i < len) {
            el.insertAdjacentHTML('beforeEnd', elements[i].outerHTML);
            i += 1;
        }
    });
};