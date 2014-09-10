/* global app */
app.directives.view = function (module) {
    module.directive(module.name + 'view', function (module) {
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
