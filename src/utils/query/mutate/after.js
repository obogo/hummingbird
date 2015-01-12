//! pattern /(\w+|\))\.after\(/
//! pattern /("|')query\1/
/**
 * @param val
 * @ref http://ejohn.org/blog/dom-insertadjacenthtml/
 */
internal('query.after', ['query'], function (query) {
    query.fn.after = function (val) {
        var parentNode, i;
        if (typeof val === 'string') {
            val = query(val);
        }
        var newEl, els = [];
        this.each(function (index, el) {
            parentNode = el.parentNode;
            i = val.length;
            while (i--) {
                el.insertAdjacentHTML('afterEnd', val[i].outerHTML);
                els.push(el.nextElementSibling);
            }
        });
        return els;
    };
});