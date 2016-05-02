/**!
 * pattern /hb\-class\=/
 */
internal('hbClass', ['hb.directive'], function (directive) {
    directive('hbClass', function () {
        return {
            link: ['scope', 'el', 'alias', '$app', function (scope, el, alias, $app) {
                var watchId = scope.$watch(function hbClass() {
                    scope.$handleBindOnce(alias, 'value', watchId);
                    this.expr = alias.value;
                    var classes = $app.interpolate(scope, alias.value, true), contained;

                    for (var e in classes) {
                        if (classes.hasOwnProperty(e)) {
                            contained = el.classList.contains(e);
                            if (classes[e]) {
                                el.classList.add(e);
                            } else if (contained) {
                                el.classList.remove(e);
                            }
                        }
                    }
                });
            }]
        };
    });
});
