/* global directives, utils */
directives.class = function (module) {
    module.directive('hbClass', function () {
        var $ = utils.query;
        return {
            link: function (scope, el, alias) {
                var $el = $(el);
                scope.$watch(function () {
                    var classes = module.interpolate(scope, alias.value);
                    for (var e in classes) {
                        if (classes.hasOwnProperty(e)) {
                            if (classes[e]) {
                                $el.addClass(e);
                            } else {
                                $el.removeClass(e);
                            }
                        }
                    }
                });
            }
        };
    });
};
