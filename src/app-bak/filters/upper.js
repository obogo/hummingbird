/* global app */
app.filters.upper = function (module) {
    module.filter('upper', function () {
        return function (val) {
            return (val + '').toUpperCase();
        };
    });
};