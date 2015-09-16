//TODO: need to add query syntax.
/**
 * Fast check to see if an element is in view of the window.
 */
define('isInView', [], function () {
//TODO: if you pass one. It will need to say if that one is in view. If you pass many, it will only pass if all are in view.
    function isInView(el) {
        var r, html;
        if (!el || 1 !== el.nodeType) {
            return false;
        }
        html = document.documentElement;
        r = el.getBoundingClientRect();

        return ( !!r
            && r.bottom >= 0
            && r.right >= 0
            && r.top <= html.clientHeight
            && r.left <= html.clientWidth
        );
    }

    return isInView;
});