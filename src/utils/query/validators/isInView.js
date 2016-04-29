/**
 * Fast check to see if an element is in view of the window.
 */
//! pattern /(\s|query)\(.*?\)\.isInView\(/
define('isInView', ['query'], function (query) {

    function isInView(el) {
        var r, html;
        if (!el || 1 !== el.nodeType) {
            return false;
        }
        html = document.documentElement;
        r = el.getBoundingClientRect();

        return ( !!r &&
            r.bottom >= 0 &&
            r.right >= 0 &&
            r.top <= html.clientHeight &&
            r.left <= html.clientWidth
        );
    }

    query.fn.isInView = function () {
        var returnVal = true;
        this.each(function (index, el) {
            returnVal = isInView(el);
            return returnVal;
        });
        return returnVal;
    };

    return isInView;
});