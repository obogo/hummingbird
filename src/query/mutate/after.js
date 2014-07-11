/*global query */
/**
 *
 * @param val
 * @ref http://ejohn.org/blog/dom-insertadjacenthtml/
 */
query.fn.after = function (val) {
    var parentNode, i;
    if (typeof val === 'string') {
        val = query(val);
    }
    this.each(function (index, el) {
        parentNode = el.parentNode;
        i = val.length;
        while (i--) {
            el.insertAdjacentHTML('afterEnd', val[i].outerHTML);
        }
    });
};