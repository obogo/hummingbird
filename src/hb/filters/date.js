//! pattern /(\|date)/
define('hb.date', ['hb.filter', 'date.format'], function(filter, formatter) {
    // we just need to include formatter. because it setups the date prototype.
    filter('date', function () {
        return function (val, format) {
            if (val && !(val instanceof Date)) {
                val = new Date(val);
            }
            return val ? val.format(format) : '';
        };
    });
});