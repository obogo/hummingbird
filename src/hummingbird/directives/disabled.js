/* global app */
hummingbird.directives.disabled = function (module) {
    module.directive(module.name + 'disabled', function () {
        return {
            link: function (scope, el, alias) {
                var disabled = 'disabled';
                scope.$watch(alias.value, function (newVal) {
                    if (newVal) {
                        el.setAttribute(disabled, disabled);
                    } else {
                        el.removeAttribute(disabled);
                    }
                });
            }
        };
    });
};
