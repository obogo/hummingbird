//! pattern /(\s|query)\(.*?\)\.before\(/
/**
 * @param val
 * @ref http://ejohn.org/blog/dom-insertadjacenthtml/
 */
define('query.before', ['query'], function (query) {
    query.fn.before = function (val) {
        var parentNode, i, len;
        if (typeof val === 'string') {
            val = query(val, this.context);
        }
        var els = [];
        this.each(function (index, el) {
            parentNode = el.parentNode;
            i = 0;
            len = val.length;
            while (i < len) {
                el.insertAdjacentHTML('beforeBegin', val[i].outerHTML);
                els.push(el.previousElementSibling);
                i += 1;
            }
        });
        return els;
    };
});