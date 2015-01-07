/* global internal */
internal('hbf.lower', ['hb.filter'], function (filter) {
    filter('lower', function (module) {
        return function (val) {
            return (val + '').toLowerCase();
        };
    });
});
