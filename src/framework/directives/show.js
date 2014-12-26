internal('directives.show', ['framework'], function (framework) {
    return framework.directives.show = function (module) {
        module.directive('hbShow', function () {
            return {
                scope: true,
                link: function (scope, el, alias) {
                    scope.$watch(alias.value, function (newVal, oldVal) {
                        if (newVal) {
                            scope.$ignore(false, true);
                            el.style.display = null;
                        } else {
                            scope.$ignore(true, true);
                            el.style.display = 'none';
                        }
                    });
                }
            };
        });
    };
});
