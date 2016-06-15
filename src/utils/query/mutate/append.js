//! pattern /(\s|query)\(.*?\)\.append\(/
/**
 * @param val
 * @ref http://ejohn.org/blog/dom-insertadjacenthtml/
 */
define('query.append', ['query'], function (query) {
    query.fn.append = function (val) {
        var i, len;
        if (typeof val === 'string') {
            val = query(val, this.context);
        }
        var els = [];
        this.each(function (index, el) {
            i = 0;
            len = val.length;
            while (i < len) {
                el.insertAdjacentHTML('beforeEnd', val[i].outerHTML);
                els.push(el.lastElementChild);
                i += 1;
            }
        });
        return els;
    };
});