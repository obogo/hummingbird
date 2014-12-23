/*global query */
require('query', function (query) {
    query.fn.isVisible = function () {
        var el;
        if (this.length) {
            el = this[0];
            // Return true for document node
            if (el.parentNode.nodeType === 9) {
                return true;
            }

            if (el.offsetWidth === 0 || el.offsetHeight === 0) {
                return false;
            }

            if (el.style.display === 'none') {
                return false;
            }

            if (el.style.visibility === 'hidden') {
                return false;
            }

            if (el.style.opacity === 0 || el.style.opacity === '0') {
                return false;
            }

            // element passed
            return true;
        }
        return false;
    };
});