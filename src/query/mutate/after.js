/*global query */
/**
 *
 * @param elements
 * @ref http://ejohn.org/blog/dom-insertadjacenthtml/
 */
query.fn.after = function (elements) {
    var parentNode, i;
    if (typeof elements === 'string') {
        elements = query(elements);
    }
    this.each(function (index, el) {
        parentNode = el.parentNode;
        i = elements.length;
        while (i--) {
            el.insertAdjacentHTML('afterEnd', elements[i].outerHTML);
        }
    });
};