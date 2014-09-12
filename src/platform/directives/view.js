/* global directives, utils */
directives.view = function (module) {
    module.directive(module.name + 'view', function () {
        return {
            link: function (scope, el, alias) {
                scope.$watch(alias.value, function (newVal) {
                    if (el.children.length) {
                        module.removeChild(el.children[0]);
                    }
                    var template = module.get(newVal);
                    module.addChild(el, template);
                });
            }
        };
    });
};
