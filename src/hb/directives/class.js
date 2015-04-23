/**!
 * pattern /hb\-class\=/
 */
internal('hbd.class', ['hb.directive'], function (directive) {
    directive('hbClass', function ($app) {
        return {
            link: function (scope, el, alias) {
                var watchId = scope.$watch(function hbClass() {
                    scope.$handleBindOnce(alias, 'value', watchId);
                    this.expr = alias.value;
                    var classes = $app.interpolate(scope, alias.value, true), contained;

                    for (var e in classes) {
                        if (classes.hasOwnProperty(e)) {
                            contained = el.classList.contains(e);
                            if (classes[e]) {
                                el.classList.add(e);
                            } else if(contained) {
                                el.classList.remove(e);
                            }
                        }
                    }
                });
            }
        };
    });
});
