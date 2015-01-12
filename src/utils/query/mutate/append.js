/**
 * @param val
 * @ref http://ejohn.org/blog/dom-insertadjacenthtml/
 */
internal('query.append', ['query'], function (query) {
    query.fn.append = function (val) {
        var parentNode, i, len;
        if (typeof val === 'string') {
            val = query(val);
        }
        var els = [];
        this.each(function (index, el) {
            parentNode = el.parentNode;
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