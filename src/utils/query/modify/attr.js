/**!
 * all matches must be matched for it to be included.
 * pattern /\)\.attr\(/
 * pattern /\)\.removeAttr\(/
 * pattern /(\s|query)\(.*?\)\.data\(/
 */
internal('query.attr', ['query'], function (query) {
    query.fn.removeAttr = function (prop) {
        this.each(function (index, el) {
            el.removeAttribute(prop);
        });
        return this;
    };

    query.fn.attr = function (prop, value) {
        // if there are 2 arguments, it's a setter
        if (arguments.length === 2) {
            if (typeof value === 'function') {
                this.each(function (index, el) {
                    var result = value.apply(el, [index, prop]);
                    this.setAttribute(prop, result);
                });
            } else {
                this.each(function (index, el) {
                    el.setAttribute(prop, value);
                });
            }
            return this;
        }

        // if there is an object, it's a setter
        if (typeof prop === 'object') {
            this.each(function (index, el) {
                for (var n in prop) {
                    if (prop.hasOwnProperty(n)) {
                        el.setAttribute(n, prop[n]);
                    }
                }
            });
            return this;
        }

        // if there is a length, there is something to return
        if (this.length) {
            return this[0].getAttribute(prop);
        }
    };

    query.fn.data = function (prop, value) {
        return this.attr('data-' + prop, value);
    };
});