define('isVisible', [], function () {
    function isVisible(self) {
        var el;
        self = self || this;
        self = self instanceof HTMLElement ? [self] : self;
        if (self.length) {
            el = self[0];
            // Return true for document node
            if (el.style.display === 'none') {
                return false;
            }

            if (el.style.visibility === 'hidden') {
                return false;
            }

            if (el.style.opacity === 0 || el.style.opacity === '0') {
                return false;
            }
            // check these last because they are the slowest.
            if (el.parentNode.nodeType === 9) {
                return true;
            }

            if (el.offsetWidth === 0 || el.offsetHeight === 0) {
                return false;
            }

            // element passed
            return true;
        }
        return false;
    }
    return isVisible;
});