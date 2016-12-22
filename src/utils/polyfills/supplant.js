//! pattern /\.supplant\(/
define('supplant', function () {
    return function supplant(s, o) {
        return s.replace(/{([^{}]*)}/g,
            function (a, b) {
                var p = b.split('.'), r = o, v;
                for(var i = 0; i < p.length; i += 1) {
                    v = p[i];
                    if (!r || !r.hasOwnProperty(v)) {
                        return a;
                    }
                    r = r[v];
                }
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            }
        );
    };
});

