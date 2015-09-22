define('query.vendor', ['query'], function (query) {
    var pfx = ["webkit", "moz", "MS", "o", ""];
    var len = pfx.length;

    function vendor(el, prop, value) {
        var p, v, isTransition = prop === 'transition';// smart enough to know transition needs done differently
        for (var i = 0; i < len; i += 1) {
            p = applyVendor(prop, pfx[i]);
            if (isTransition) {
                p = prop;
                v = isTransition ? applyTransition(value, pfx[i]) : value;
            } else {
                p = applyVendor(prop, pfx[i]);
                v = value;
            }
            el.style[p] = v;
        }
    }

    function applyVendor(prop, prefix) {
        return prefix && prefix + prop.charAt(0).toUpperCase() + prop.substr(1, prop.length) || prop;
    }

    function applyTransition(prop, prefix) {
        return (prefix && '-' + prefix + '-' || '') + prop;
    }

    query.fn.vendor = function (prop, value) {
        this.each(function (index, el) {
            vendor(el, prop, value);
        });
        return this;
    };

    return vendor;
});