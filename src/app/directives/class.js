(function () {

    app.directives.class = function (module, namespace) {
        namespace = namespace || app.consts.PREFIX;

        module.directive(namespace + 'class', function (module) {
            function toggle(add, cls, obj, el) {
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
                        console.log('toggle');
//                        helpers.each(classes, toggle, el);
                    });
                }
            };
        });


//        module.directive(namespace + 'class', function (module) {
//
//            var $ = query;
//
//            return {
//                link: function (scope, el, alias) {
//                    var $el = $(el);
//                    scope.$watch(function () {
//                        var classes = module.interpolate(scope, alias.value);
//                        for (var e in classes) {
//                            if (classes[e]) {
//                                $el.addClass(e);
//                            } else {
//                                $el.removeClass(e);
//                            }
//                        }
//                    });
//                }
//            };
//        });
    };
}());