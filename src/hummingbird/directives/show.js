/* global app, query */
hummingbird.directives.show = function (module) {
    module.directive(module.name + 'show', function () {
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
