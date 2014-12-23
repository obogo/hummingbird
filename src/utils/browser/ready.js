/* global browser */
define('ready', function () {

    /*global document, query */
    var callbacks = [],
        win = window,
        doc = document,
        ADD_EVENT_LISTENER = 'addEventListener',
        REMOVE_EVENT_LISTENER = 'removeEventListener',
        ATTACH_EVENT = 'attachEvent',
        DETACH_EVENT = 'detachEvent',
        DOM_CONTENT_LOADED = 'DOMContentLoaded',
        ON_READY_STATE_CHANGE = 'onreadystatechange',
        COMPLETE = 'complete',
        READY_STATE = 'readyState';

    var ready = function (callback) {
        callbacks.push(callback);
    };

    var DOMContentLoaded;

    function invokeCallbacks() {
        var i = 0, len = callbacks.length;
        while (i < len) {
            callbacks[i]();
            i += 1;
        }
        callbacks.length = 0;
    }

    // Cleanup functions for the document ready method
    // attached in the bindReady handler
    if (doc[ADD_EVENT_LISTENER]) {
        DOMContentLoaded = function () {
            doc[REMOVE_EVENT_LISTENER](DOM_CONTENT_LOADED, DOMContentLoaded, false);
            invokeCallbacks();
        };

    } else if (doc.attachEvent) {
        DOMContentLoaded = function () {
            // Make sure body exists, at least, in case IE gets a little overzealous
            if (doc[READY_STATE] === COMPLETE) {
                doc[DETACH_EVENT](ON_READY_STATE_CHANGE, DOMContentLoaded);
                invokeCallbacks();
            }
        };
    }

    // Catch cases where $(document).ready() is called after the
    // browser event has already occurred.
    if (doc[READY_STATE] === COMPLETE) {
        // Handle it asynchronously to allow scripts the opportunity to delay ready
        setTimeout(invokeCallbacks, 1);
    }

    // Mozilla, Opera and webkit nightlies currently support this event
    if (doc[ADD_EVENT_LISTENER]) {
        // Use the handy event callback
        doc[ADD_EVENT_LISTENER](DOM_CONTENT_LOADED, DOMContentLoaded, false);
        // A fallback to window.onload, that will always work
        win[ADD_EVENT_LISTENER]('load', invokeCallbacks, false);
        // If IE event model is used
    } else if (doc[ATTACH_EVENT]) {
        // ensure firing before onload,
        // maybe late but safe also for iframes
        doc[ATTACH_EVENT](ON_READY_STATE_CHANGE, DOMContentLoaded);

        // A fallback to window.onload, that will always work
        win[ATTACH_EVENT]('onload', invokeCallbacks);
    }

    return ready;

});
