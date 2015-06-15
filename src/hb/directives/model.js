/**!
 * This is designed to be a bindable model to property value that only works
 * with input elements.
 *
 * import query.bind
 * import query.unbind
 * import query.unbindAll
 * pattern /hb\-model\=/
 */
internal('hbd.model', ['hb.directive', 'resolve', 'query', 'hb.debug', 'throttle'], function (directive, resolve, query, debug, throttle) {
    directive('hbModel', function () {
        var $ = query;
        return {
            link: ['scope', 'el', 'alias', function (scope, el, alias) {
                var $el = $(el);

                scope.$watch(alias.value, setValue);

                function getProp() {
                    if (el.hasOwnProperty('value') || el.__proto__.hasOwnProperty('value')) {
                        return 'value';
                    } else if (el.hasOwnProperty('innerText') || el.__proto__.hasOwnProperty('innerText')) {
                        return 'innerText';
                    }
                }

                // allow to work in input elements as well as html elements.
                function setValue(value) {
                    value = value === undefined ? '' : value;
                    el[getProp()] = value;
                }

                function getValue() {
                    return el[getProp()] || '';
                }

                function eventHandler(evt) {
                    resolve(scope).set(alias.value, getValue());
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
            }]
        };
    });
});
