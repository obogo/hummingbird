/*global query */
/**
 *
 * @param elements
 * @ref http://ejohn.org/blog/dom-insertadjacenthtml/
 */
utils.query.fn.prepend = function (elements) {
    var i, len;
    if (typeof elements === 'string') {
        elements = query(elements);
    }
    this.each(function (index, el) {
        i = elements.length;
        while (i--) {
            el.insertAdjacentHTML('afterBegin', elements[i].outerHTML);
        }
    });
};