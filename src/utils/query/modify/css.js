internal('query.css', ['query'], function (query) {
    query.fn.css = function (prop, value) {
        var el, returnValue;
        if (this.length) {
            el = this[0];

            if (arguments.length > 1) {
                this.each(function (index, el) {
                    el.style[prop] = value;
                });
            }

            if (prop instanceof Array) {
                var i = 0, len = prop.length;
                returnValue = {};
                if (el.currentStyle) {
                    while (i < len) {
                        returnValue[prop[i]] = el.currentStyle[prop[i]];
                        i += 1;
                    }
                } else if (window.getComputedStyle) {
                    while (i < len) {
                        returnValue[prop[i]] = document.defaultView.getComputedStyle(el, null).getPropertyValue(prop[i]);
                        i += 1;
                    }
                }
            } else {
                if (el.currentStyle) {
                    returnValue = el.currentStyle[prop];
                } else if (window.getComputedStyle) {
                    returnValue = document.defaultView.getComputedStyle(el, null).getPropertyValue(prop);
                }
            }

            return returnValue;
        }
        return null;
    };
});