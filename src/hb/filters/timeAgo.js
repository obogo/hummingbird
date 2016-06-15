/* global internal */
//! pattern /(\|timeAgo|\(\'timeAgo\'\))/
define('hbf.timeAgo', ['hb.filter', 'toTimeAgo'], function (filter, toTimeAgo) {
    filter('timeAgo', function () {
        return toTimeAgo;
    });
});


