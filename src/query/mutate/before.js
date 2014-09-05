/*global query */
/**
 *
 * @param val
 * @ref http://ejohn.org/blog/dom-insertadjacenthtml/
 */
query.fn.before = function (val) {
    var parentNode, i, len;
    if (typeof val === 'string') {
        val = query(val);
    }
    this.each(function (index, el) {
        parentNode = el.parentNode;
        i = 0;
        len = val.length;
        while (i < len) {
            el.insertAdjacentHTML('beforeBegin', val[i].outerHTML);
            i += 1;
        }
    });
};