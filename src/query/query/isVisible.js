/*global query */
query.fn.isVisible = function () {
    var el;
    if (this.length) {
        el = this[0];
        // Return true for document node
        if (el.parentNode.nodeType === 9) {
            return true;
        }

        // Return the false if el has no width or height
        if (el.offsetWidth === 0 || el.offsetHeight === 0) {
            return false;
        }

        // Return false if our element is invisible
        if (this.css(el, 'opacity') === 0 || this.css(el, 'display') === 'none' || this.css('visibility') === 'hidden') {
            return false;
        }

        // element passed
        return true;
    }
    return false;
};