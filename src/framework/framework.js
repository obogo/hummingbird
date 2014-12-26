define('framework', function () {

    var framework = {
        debug: {},
        plugins: {},
        filters: {},
        errors: {},
        directives: {}
    };

    var ON_STR = 'on';

    // TODO: Remove event bindings when element is destroyed
    framework.on = function (el, eventName, handler) {
        if (el.attachEvent) {
            el.attachEvent(ON_STR + eventName, el[eventName + handler]);
        } else {
            el.addEventListener(eventName, handler, false);
        }
    };

    framework.off = function (el, eventName, handler) {
        if (el.detachEvent) {
            el.detachEvent(ON_STR + eventName, el[eventName + handler]);
        } else {
            el.removeEventListener(eventName, handler, false);
        }
    };

    return framework;

});