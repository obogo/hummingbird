/**!
 * import query.addClass
 * import query.removeClass
 * pattern /hb\-class\=/
 */
internal('hbd.class', ['hb.directive', 'query'], function (directive, query) {
    directive('hbClass', function ($app) {
        var $ = query;
        return {
            link: function (scope, el, alias) {
                var $el = $(el);
                scope.$watch(function () {
                    var classes = $app.interpolate(scope, alias.value);
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
});
