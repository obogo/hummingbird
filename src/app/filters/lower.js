/* global app */
app.filters.lower = function (module) {
    module.filter('lower', function () {
        return function (val) {
            return (val + '').toLowerCase();
        };
    });
};
