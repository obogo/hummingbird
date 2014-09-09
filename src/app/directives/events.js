/* global app, helpers */
(function () {
    console.log('###events');
    var UI_EVENTS = 'click mousedown mouseup keydown keyup touchstart touchend touchmove'.split(' ');
    var ON_STR = 'on';

    function on(el, event, handler) {
        if (el.attachEvent) {
            el.attachEvent(ON_STR + event, el[event + handler]);
        } else {
            el.addEventListener(event, handler, false);
        }
    }

    function off(el, event, handler) {
        if (el.detachEvent) {
            el.detachEvent(ON_STR + event, el[event + handler]);
        } else {
            el.removeEventListener(event, handler, false);
        }
    }

    app.directives.events = function (module) {
        // create the event directives
        helpers.each(UI_EVENTS, function (eventName) {
            module.set(app.consts.PREFIX + eventName, function (alias) {
                return {
                    // scope: {},// pass an object if isolated. not a true
                    link: function (scope, el) {

                        function handle(evt) {
                            if (evt.target.nodeName.toLowerCase() === 'a') {
                                evt.preventDefault();
                            }
                            app.interpolate(scope, el.getAttribute(alias));
                            scope.$apply();
                            return false;
                        }

                        on(el, eventName, handle);
                        scope.$$handlers.push(function () {
                            off(el, eventName, handle);
                        });
                    }
                };
            }, 'event');
        });
    };

})();