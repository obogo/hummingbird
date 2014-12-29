internal('filters.lower', ['framework'], function (framework) {
    return framework.filters.lower = function (module) {
        module.filter('lower', function () {
            return function (val) {
                return (val + '').toLowerCase();
            };
        });
    };
});
