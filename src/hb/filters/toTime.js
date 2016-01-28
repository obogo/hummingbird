/* global internal */
//! pattern /(\|toTime|\(\'toTime\'\))/
internal('hbf.toTime', ['hb.filter', 'toTime'], function (filter, toTime) {
    filter('toTime', function() {
        return toTime;
    });
});


