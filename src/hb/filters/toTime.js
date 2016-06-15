/* global internal */
//! pattern /(\|toTime|\(\'toTime\'\))/
define('hbf.toTime', ['hb.filter', 'toTime'], function (filter, toTime) {
    filter('toTime', function() {
        return toTime;
    });
});