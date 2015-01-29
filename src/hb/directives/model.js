/**!
 * This is designed to be a bindable model to property value that only works
 * with input elements.
 *
 * import query.bind
 * import query.unbind
 * import query.unbindAll
 * pattern /hb\-model\=/
 */
internal('hbd.model', ['hb.directive', 'resolve', 'query', 'hb.errors', 'throttle'], function (directive, resolve, query, errors, throttle) {
    directive('hbModel', function () {
        var $ = query;
        return {
            link: function (scope, el, alias) {
                var $el = $(el);

                scope.$watch(alias.value, function (newVal) {
                    if (!el.hasOwnProperty('value')) {
                        throw errors.E13;
                    }
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

                // must do a debounce here. Multiples of these could fire. We only want one $apply to happen.
                $el.bind('change keyup blur input onpropertychange', throttle(eventHandler, 10));

                scope.$on('$destroy', function () {
                    $el.unbindAll();
                });
            }
        };
    });
});
