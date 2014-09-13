/* global directives, utils */
directives.disabled = function (module) {
    module.directive('disabled', function () {
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
