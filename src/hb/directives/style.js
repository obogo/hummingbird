/**!
 * pattern /hb\-class\=/
 */
internal('hbd.style', ['hb.directive', 'fromDashToCamel'], function (directive, fromDashToCamel) {
    directive('hbStyle', function ($app) {
        return {
            link: function (scope, el, alias) {
                scope.$watch(function style() {
                    this.expr = alias.value;
                    var styles = $app.interpolate(scope, alias.value);
                    var name;
                    for (var e in styles) {
                        if (styles.hasOwnProperty(e)) {
                            name = fromDashToCamel(e);
                            if (el.style[name] !== styles[e]) {
                                el.style[name] = styles[e];
                            }
                        }
                    }
                });
            }
        };
    });
});
