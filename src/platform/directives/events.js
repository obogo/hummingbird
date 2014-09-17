/* global directives, utils */
(function () {
    var UI_EVENTS = 'click mousedown mouseup keydown keyup touchstart touchend touchmove'.split(' ');
    var pfx = ["webkit", "moz", "MS", "o", ""];
    var ANIME_EVENTS = 'AnimationStart AnimationEnd'.split(' ');

    function onAnime(element, eventType, callback) {
        for (var p = 0; p < pfx.length; p++) {
            if (!pfx[p]) {
                eventType = eventType.toLowerCase();
            }
            element.addEventListener(pfx[p] + eventType, callback, false);
        }
    }

    directives.events = function (module) {

        function setup(eventName, handle) {
            return function directive() {
                return {
                    // scope: {},// pass an object if isolated. not a true
                    link: function (scope, el, alias) {

                        function handle(evt) {
                            if (evt.target.nodeName.toLowerCase() === 'a') {
                                evt.preventDefault();
                            }
                            scope.$event = evt;
                            module.interpolate(scope, alias.value);
                            scope.$apply();
                            return false;
                        }

                        handle(el, eventName, handle);
                    }
                };
            };
        };

        // create the animation event directives
        // create the event directives
        utils.each(ANIME_EVENTS, function (eventName) {
            module.set(eventName, function () {
                return {
                    // scope: {},// pass an object if isolated. not a true
                    link: function (scope, el, alias) {

                        function handle(evt) {
                            if (evt.target.nodeName.toLowerCase() === 'a') {
                                evt.preventDefault();
                            }
                            scope.$event = evt;
                            if(evt.target === el) {
                                module.interpolate(scope, alias.value);
                                scope.$apply();
                            }
                            return false;
                        }

                        onAnime(el, eventName, handle);
                    }
                };
            }, 'event');
        });

        // create the event directives
        utils.each(UI_EVENTS, function (eventName) {
            module.set(eventName, function () {
                return {
                    // scope: {},// pass an object if isolated. not a true
                    link: function (scope, el, alias) {

                        function handle(evt) {
                            if (evt.target.nodeName.toLowerCase() === 'a') {
                                evt.preventDefault();
                            }
                            scope.$event = evt;
                            module.interpolate(scope, alias.value);
                            scope.$apply();
                            return false;
                        }

                        exports.on(el, eventName, handle);
                    }
                };
            }, 'event');
        });
    };

})();