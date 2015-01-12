//! pattern /(\w+|\))\.prepend\(/
//! pattern /("|')query\1/
/**
 * @param elements
 * @ref http://ejohn.org/blog/dom-insertadjacenthtml/
 */
internal('query.prepend', ['query'], function (query) {
    query.fn.prepend = function (elements) {
        var i, len;
        if (typeof elements === 'string') {
            elements = query(elements);
        }
        var newEl, els = [];
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