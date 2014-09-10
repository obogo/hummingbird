(function () {
    app.directives.view = function (name, module) {
        module.directive('goView', function () {
            return {
                link: function (scope, el, alias) {
                    scope.$watch(alias.value, function (newVal) {
                        if (el.children.length) {
                            module.removeChild(el.children[0]);
                            el.children[0].remove();
                        }
                        var view = module.view(newVal);
                        module.addChild(el, view);
                    });
                }
            };
        });
    };
}());