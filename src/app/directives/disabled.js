(function () {
    app.directives.disabled = function (module, namespace) {

        namespace = namespace || app.consts.PREFIX;

        module.directive(namespace + 'disabled', function (module) {
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