define('hbClickOutside', ['hb.directive'], function (directive) {
    directive('hbClickOutside', ['$window', '$apply', function ($window, $apply) {

        return {
            link: ['scope', 'el', 'alias', function (scope, el, alias) {

                var enabled = false,
                    engaged,
                    engageEvents = ['touchstart', 'mousedown'],
                    disengageEvents = ['touchmove', 'mousemove'],
                    fireEngageEvents = ['mouseup', 'touchend', 'touchcancel'],
                    on = $window.addEventListener ? 'addEventListener' : 'attachEvent',
                    off = $window.removeEventListener ? 'removeEventListener' : 'detachEvent',
                    opened = 'none';

                // cannot check scope.$$ignore here because show sets the children of the scope.$$ignore not the current one
                scope.$watch(function () {
                    var display = el.style.display;
                    if (display !== opened) {
                        opened = display;
                        enable(opened !== 'none');
                    }
                });
                scope.$on('$destroy', destroy);

                function contained(evt) {
                    if (el && engaged) {
                        if (!el.contains(evt.target)) {
                            scope.$outside = true;
                            scope.$event = evt;
                            scope.$eval(alias.value);
                            $apply();
                            return;
                        }
                        scope.$outside = true;
                        scope.$eval(alias.value);
                    }
                }

                function _enable(evt) {
                    engaged = evt;
                }

                function _disable(evt) {
                    engaged = '';
                }

                function updateEvents(method, eventList, listener) {
                    var i, len = eventList.length;
                    for (i = 0; i < len; i += 1) {
                        $window[method](eventList[i], listener, true);
                    }
                }

                function listen() {
                    updateEvents(on, engageEvents, _enable);
                    updateEvents(on, disengageEvents, _disable);
                    updateEvents(on, fireEngageEvents, contained);
                }

                function unlisten() {
                    updateEvents(off, engageEvents, _enable);
                    updateEvents(off, disengageEvents, _disable);
                    updateEvents(off, fireEngageEvents, contained);
                }

                function enable(value) {
                    if (value !== undefined) {
                        if (value && !enabled) {
                            enabled = true;
                            setTimeout(listen, 100);
                        } else if (!value && enabled) {
                            enabled = false;
                            unlisten();
                        }
                    }
                    return enabled;
                }

                function destroy() {
                    unlisten();
                    scope = el = alias = null;
                }
            }]
        };

    }]);
});