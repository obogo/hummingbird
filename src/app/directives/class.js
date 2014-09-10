/* global app, query */
app.directives.class = function (module) {
    module.directive(module.name + 'class', function (module) {
        var $ = query;
        return {
            link: function (scope, el, alias) {
                var $el = $(el);
                scope.$watch(function () {
                    var classes = module.interpolate(scope, alias.value);
                    for (var e in classes) {
                        if (classes[e]) {
                            $el.addClass(e);
                        } else {
                            $el.removeClass(e);
                        }
                    }
                });
            }
        };
    });
};