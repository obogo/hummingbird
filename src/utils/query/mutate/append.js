/*global query */
/**
 *
 * @param val
 * @ref http://ejohn.org/blog/dom-insertadjacenthtml/
 */
utils.query.fn.append = function (val) {
    var parentNode, i, len;
    if (typeof val === 'string') {
        val = query(val);
    }
    this.each(function (index, el) {
        parentNode = el.parentNode;
        i = 0;
        len = val.length;
        while (i < len) {
            el.insertAdjacentHTML('beforeEnd', val[i].outerHTML);
            i += 1;
        }
    });
};