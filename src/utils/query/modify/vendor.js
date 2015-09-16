//TODO: make as part of query syntax
define('vendor', [], function () {
    var pfx = ["webkit", "moz", "MS", "o", ""];
    var len = pfx.length;

    function vendor(el, prop, value, vendorfyValue) {
        var p, v;
        for (var i = 0; i < len; i += 1) {
            p = vendorfy(prop, pfx[i]);
            if (vendorfyValue) {
                p = prop;
                v = vendorfyValue ? vendorDashfy(value, pfx[i]) : value;
            } else {
                p = vendorfy(prop, pfx[i]);
                v = value;
            }
            el.style[p] = v;
            //console.log(p, v);
        }
    }

    function vendorfy(prop, prefix) {
        return prefix && prefix + prop.charAt(0).toUpperCase() + prop.substr(1, prop.length) || prop;
    }

    function vendorDashfy(prop, prefix) {
        return (prefix && '-' + prefix + '-' || '') + prop;
    }

    return vendor;
});