internal('directives.events', ['framework', 'each'], function (framework, each) {

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

    return framework.directives.events = function (module) {

        // create the animation event directives
        // create the event directives
        each(ANIME_EVENTS, function (eventName) {
            module.val(eventName, function () {
                return {
                    // scope: {},// pass an object if isolated. not a true
                    link: function (scope, el, alias) {

                        function handle(evt) {
                            if (evt.target.nodeName.toLowerCase() === 'a') {
                                evt.preventDefault();
                            }
                            scope.$event = evt;
                            if (evt.target === el) {
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
        each(UI_EVENTS, function (eventName) {
            module.directive('hb' + eventName.charAt(0).toUpperCase() + eventName.substr(1), function () {
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

                        framework.on(el, eventName, handle);
                    }
                };
            }, 'event');
        });
    };

});