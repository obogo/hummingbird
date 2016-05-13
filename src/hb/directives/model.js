/**!
 * This is designed to be a bindable model to property value that only works
 * with input elements. This also adds use of hb-valid so you can validate hb-model fields.
 *
 * import query.bind
 * import query.unbind
 * import query.unbindAll
 * pattern /hb\-model\=/
 */
internal('hbModel', ['hb.directive', 'resolve', 'query', 'hb.debug', 'throttle'], function (directive, resolve, query, debug, throttle) {
    var $ = query,
        SELECTED_OPTIONS = "selectedOptions",
        CHECKED = "checked",
        VALUE = "value",
        INNER_TEXT = "innerText",
        RADIO = "radio";

    directive('hbModel', function () {
        return {
            link: ['scope', 'el', 'alias', 'attr', function (scope, el, alias, attr) {
                var $el = $(el),
                    multipleSelect = false,
                    prop = getProp();

                scope.$watch(alias.value, setValue);

                function getProp() {
                    if (el.type && el.type === "select-one") {
                        multipleSelect = false;
                        return SELECTED_OPTIONS;
                    }
                    if (el.type && el.type === "select") {
                        multipleSelect = true;
                        return SELECTED_OPTIONS;
                    }
                    if (el.type && el.type === "checkbox" || el.type && el.type === RADIO) {
                        return CHECKED;
                    }
                    if (el.hasOwnProperty('value') || el.__proto__.hasOwnProperty('value')) {
                        return VALUE;
                    }
                    if (el.hasOwnProperty('innerText') || el.__proto__.hasOwnProperty('innerText')) {
                        return INNER_TEXT;
                    }
                }

                // allow to work in input elements as well as html elements.
                function setValue(value) {
                    value = value === undefined ? '' : value;
                    if (prop === SELECTED_OPTIONS && !multipleSelect) {
                        for (var i = 0; i < el.options.length; i += 1) {
                            if (el.options[i].value === value || el.options[i].value === value.value) {
                                el.options.selectedIndex = i;
                                return;
                            }
                        }
                        return;
                    } else if (prop === CHECKED && el.type === RADIO) {
                        el.checked = scope.$eval(el.value) === value;
                    } else {
                        el[prop] = value;
                    }
                    if (attr.hbValid) {
                        scope.$eval(attr.hbValid, scope, {
                            target: el,
                            property: alias.value,
                            value: getValue(),
                            validity: el.validity,
                            validationMessage: el.validationMessage
                        });
                    }

                }

                function getValue() {
                    if (prop === SELECTED_OPTIONS && !multipleSelect) {
                        return el[prop][0] && el[prop][0].value;
                    }
                    if (prop === CHECKED && el.type === RADIO) {
                        return scope.$eval(el.value);
                    }
                    return el[prop] || '';
                }

                function eventHandler(evt) {
                    resolve(scope).set(alias.value, getValue());
                    // because the model changes are listened to through a change. Automatically evaluate an hb-change if it is on the same dom as a hb-model.
                    var change = el.getAttribute('hb-change');
                    if (change) {
                        scope.$event = evt;
                        scope.$eval(change);
                    }
                    scope.$apply();
                }

                // must do a debounce here. Multiples of these could fire. We only want one $apply to happen.
                $el.bind('click change keyup blur input onpropertychange', throttle(eventHandler, 10));

                scope.$on('$destroy', function () {
                    $el.unbindAll();
                });
            }]
        };
    });
});
