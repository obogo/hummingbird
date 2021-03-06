//! pattern /(\s|query)\(.*?\)\.prepend\(/
/**
 * @param elements
 * @ref http://ejohn.org/blog/dom-insertadjacenthtml/
 */
define('query.prepend', ['query'], function (query) {
    query.fn.prepend = function (elements) {
        var i;
        if (typeof elements === 'string') {
            elements = query(elements, this.context);
        }
        var els = [];
        this.each(function (index, el) {
            i = elements.length;
            while (i--) {
                el.insertAdjacentHTML('afterBegin', elements[i].outerHTML);
                els.push(el.firstElementChild);
            }
        });
        return els;
    };
});