//! pattern /(\|numtrim)/
define('hbNumTrim', ['hb.filter'], function (filter) {
    var vals = [
        {min:1000, value:'k'},
        {min:1000000, value:'m'},
        {min:1000000000, value:'t'},
        {min:1000000000000, value:'q'}
    ];
    filter('numTrim', function () {
        return function (val) {
            var n = parseInt(val, 10);
            for(var i = 0; i < vals.length; i += 1) {
                if (n > vals[i].min && n < vals[i + 1].min) {
                    return (n/vals[i].min).toFixed(1) + vals[i].value;
                }
            }
            return n;
        };
    });
});
