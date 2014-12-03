(function (exp) {
    var ON_STR = 'on';

    function on(el, eventName, handler) {
        if (el.attachEvent) {
            el.attachEvent(ON_STR + eventName, el[eventName + handler]);
        } else {
            el.addEventListener(eventName, handler, false);
        }
    }

// TODO: Remove event bindings when element is destroyed
    function off(el, eventName, handler) {
        if (el.detachEvent) {
            el.detachEvent(ON_STR + eventName, el[eventName + handler]);
        } else {
            el.removeEventListener(eventName, handler, false);
        }
    }

    exp.on = on;
    exp.off = off;
}(exports));