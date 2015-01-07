/**!
 * import query.bind
 * import query.unbind
 * import query.unbindAll
 */
internal('hbd.model', ['hb.directive', 'resolve', 'query'], function (directive, resolve, query) {
    directive('hbModel', function () {
        var $ = query;
        return {
            link: function (scope, el, alias) {
                var $el = $(el);

                scope.$watch(alias.value, function (newVal) {
                    el.value = newVal;
                });

                function eventHandler(evt) {
                    resolve(scope).set(alias.value, el.value);
                    // because the model changes are listened to through a change. Automatically evaluate an hb-change if it is on the same dom as a hb-model.
                    var change = el.getAttribute('hb-change');
                    if (change) {
                        scope.$eval(change);
                    }
                    scope.$apply();
                }

                $el.bind('change keyup blur input onpropertychange', eventHandler);

                scope.$on('$destroy', function () {
                    $el.unbindAll();
                });
            }
        };
    });
});
