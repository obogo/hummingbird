//! pattern /(\|number)/
define('hbNumber', ['hb.filter', 'num'], function (filter, num) {
    filter('number', function () {
        return num;
    });
});
