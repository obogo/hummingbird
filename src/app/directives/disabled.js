(function () {
    app.directives.disabled = function (name, module) {
        module.directive('goDisabled', function (linker) {
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
}());