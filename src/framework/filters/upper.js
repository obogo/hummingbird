append('filters.lower', ['framework'], function (framework) {
    return framework.filters.upper = function (module) {
        module.filter('upper', function () {
            return function (val) {
                return (val + '').toUpperCase();
            };
        });
    };
});