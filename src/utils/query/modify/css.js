/**!
 * all matches must be matched for it to be included.
 * pattern /(\s|query)\(.*?\)\.css\(/
 */
define('query.css', ['query'], function (query) {
    query.fn.css = function (prop, value) {
        var el, returnValue, i, len;
        if (this.length) {
            el = this[0];

            if (arguments.length > 1) {
                this.each(function (index, el) {
                    el.style[prop] = value;
                });
            } else if (arguments.length === 1 && typeof prop === "object") {
                for (i in prop) {
                    if (prop.hasOwnProperty(i)) {
                        el.style[i] = prop[i];
                    }
                }
            }

            if (prop instanceof Array) {
                i = 0;
                len = prop.length;
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
            } else if (typeof prop === "object") {
                returnValue = {};
                if (el.currentStyle) {
                    for (i in prop) {
                        if (prop.hasOwnProperty(i)) {
                            returnValue[prop[i]] = el.currentStyle[prop[i]];
                        }
                    }
                } else if (window.getComputedStyle) {
                    for (i in prop) {
                        if (prop.hasOwnProperty(i)) {
                            returnValue[prop[i]] = document.defaultView.getComputedStyle(el, null).getPropertyValue(prop[i]);
                        }
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