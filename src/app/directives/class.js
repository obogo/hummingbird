(function () {
    app.directives.class = function(name, module) {
        module.directive(name + 'Class', function (module, alias) {
            function toggle(add, cls, obj, el) {
                var contained = el.classList.contains(cls);
                if (add && !contained) {
                    el.classList.add(cls);
                } else if (contained && !add) {
                    el.classList.remove(cls);
                }
            }

            return {
                link: function (scope, el) {
                    var classes = module.interpolate(scope, el.getAttribute(alias));
                    scope.$watch(function () {
                        helpers.each(classes, toggle, el);
                    });
                }
            };
        });
    };
}());