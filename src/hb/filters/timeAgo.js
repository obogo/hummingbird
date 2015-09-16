/* global internal */
//! pattern /(\|timeAgo|\(\'timeAgo\'\))/
internal('hbf.timeAgo', ['hb.filter', 'toTimeAgo'], function (filter, toTimeAgo) {
    filter('timeAgo', function () {
        return toTimeAgo;
    });
});


