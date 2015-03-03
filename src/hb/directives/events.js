//! pattern /hb\-(click|mousedown|mouseup|keydown|keyup|touchstart|touchend|touchmove|animation\-start|animation\-end)\=/
internal('hbd.events', ['hb', 'hb.val', 'each'], function (hb, val, each) {

    var UI_EVENTS = 'click mousedown mouseup mouseover mouseout keydown keyup touchstart touchend touchmove'.split(' ');
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

    // create the animation event directives
    // create the event directives
    each(ANIME_EVENTS, function (eventName) {
        val('hb' + eventName, ['$app', function ($app) {
            return {
                // scope: {},// pass an object if isolated. not a true
                link: function (scope, el, alias) {

                    function handle(evt) {
                        if (evt.target.nodeName.toLowerCase() === 'a') {
                            evt.preventDefault();
                        }
                        scope.$event = evt;
                        if (evt.target === el) {
                            $app.interpolate(scope, alias.value);
                            scope.$apply();
                        }
                        return false;
                    }

                    onAnime(el, eventName, handle);
                }
            };
        }], 'event');
    });

    // create the event directives
    each(UI_EVENTS, function (eventName) {
        val('hb' + eventName.charAt(0).toUpperCase() + eventName.substr(1), ['$app', function ($app) {
            return {
                // scope: {},// pass an object if isolated. not a true
                link: function (scope, el, alias) {

                    function handle(evt) {
                        if (evt.target.nodeName.toLowerCase() === 'a') {
                            evt.preventDefault();
                        }
                        scope.$event = evt;
                        $app.interpolate(scope, alias.value);
                        scope.$apply();
                        return false;
                    }

                    hb.on(el, eventName, handle);
                }
            };
        }], 'event');
    });
});