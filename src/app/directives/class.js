(function () {
    app.directives.class = function(name, module) {
        module.directive(name + 'class', function (module) {
            function toggle(add, cls, obj, el) {
                console.log('toggle', add, cls);
                var contained = el.classList.contains(cls);
                if (add && !contained) {
                    el.classList.add(cls);
                } else if (contained && !add) {
                    el.classList.remove(cls);
                }
            }

            return {
                link: function (scope, el, alias) {
                    var classes = module.interpolate(scope, alias.value);
                    scope.$watch(function () {
                        helpers.each(classes, toggle, el);
                    });
                }
            };
        });
    };
}());