/* global browser */
(function () {

    /*global document, query */
    var callbacks = [];

    browser.ready = function (callback) {
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
    if (document.addEventListener) {
        DOMContentLoaded = function () {
            document.removeEventListener('DOMContentLoaded', DOMContentLoaded, false);
            invokeCallbacks();
        };

    } else if (document.attachEvent) {
        DOMContentLoaded = function () {
            // Make sure body exists, at least, in case IE gets a little overzealous
            if (document.readyState === 'complete') {
                document.detachEvent('onreadystatechange', DOMContentLoaded);
                invokeCallbacks();
            }
        };
    }

// Catch cases where $(document).ready() is called after the
// browser event has already occurred.
    if (document.readyState === 'complete') {
        // Handle it asynchronously to allow scripts the opportunity to delay ready
        setTimeout(invokeCallbacks, 1);
    }

// Mozilla, Opera and webkit nightlies currently support this event
    if (document.addEventListener) {
        // Use the handy event callback
        document.addEventListener('DOMContentLoaded', DOMContentLoaded, false);
        // A fallback to window.onload, that will always work
        window.addEventListener('load', invokeCallbacks, false);
        // If IE event model is used
    } else if (document.attachEvent) {
        // ensure firing before onload,
        // maybe late but safe also for iframes
        document.attachEvent('onreadystatechange', DOMContentLoaded);

        // A fallback to window.onload, that will always work
        window.attachEvent('onload', invokeCallbacks);
    }
}());
