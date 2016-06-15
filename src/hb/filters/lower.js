/* global internal */
//! pattern /(\|lower|\(\'lower\'\))/
define('hbf.lower', ['hb.filter'], function (filter) {
    filter('lower', function () {
        return function (val) {
            return (val + '').toLowerCase();
        };
    });
});
