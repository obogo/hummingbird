/* global internal */
//! pattern /(\|upper|\(\'upper\'\))/
define('hbf.upper', ['hb.filter'], function (filter) {
    filter('upper', function () {
        return function (val) {
            return (val + '').toUpperCase();
        };
    });
});