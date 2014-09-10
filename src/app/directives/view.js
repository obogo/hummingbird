(function () {
    app.directives.view = function (module, namespace) {
        namespace = namespace || app.consts.PREFIX;
        module.directive(namespace + 'view', function (module) {
            return {
                link: function (scope, el, alias) {
                    scope.$watch(alias.value, function (newVal) {
                        if (el.children.length) {
                            module.removeChild(el.children[0]);
                        }
                        var view = module.view(newVal);
                        module.addChild(el, view);
                    });
                }
            };
        });
    };
}());