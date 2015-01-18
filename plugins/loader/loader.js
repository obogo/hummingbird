//(function () {
//    var n = '@@name';
//    var w = window;
//    var d = document;
//    var i = function () {
//        i.c(arguments);
//    };
//    i.q = [];
//    i.c = function (args) {
//        i.q.push(args);
//    };
//    w[n] = i;
//
//    function l() {
//        var s = d.createElement('script');
//        s.type = 'text/javascript';
//        s.async = true;
//        s.src = '@@url';
//        var x = d.getElementsByTagName('script')[0];
//        x.parentNode.insertBefore(s, x);
//    }
//
//    if (w.attachEvent) {
//        w.attachEvent('onload', l);
//    } else {
//        w.addEventListener('load', l, false);
//    }
//})();

(function () {
    var service = [];
    var listeners = [];

    function init(functions) {


        // A list of all the methods in analytics.js that we want to stub.
        var methods = functions.split(' ');

        // Define a factory to create queue stubs. These are placeholders for the
        // "real" methods in this script so that you never have to wait for the library
        // to load asynchronously to start invoking things. The `method` is always the
        // first argument, so we know which method to replay the call into.
        var factory = function (method) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(method);
                service.push(args);
                return service;
            };
        };

        // For each of our methods, generate a queueing method.
        for (var i = 0; i < methods.length; i++) {
            var method = methods[i];
            service[method] = factory(method);
        }

        service.ready = function (callback) {
            listeners.push(callback);
        };

        // Find the first script element on the page and insert our script next to it.
        var firstScript = document.getElementsByTagName('script')[0];
        firstScript.parentNode.insertBefore(script, firstScript);

        window['@@namespace'] = service;
    }

    // Create an async script element for analytics.js based on your API key.
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = '@@url';
    script.onload = script.onerror = function () {
        var i = 0, len = service.length;
        for (i; i < len; i++) {
            var args = service[i];
            var method = args.shift();
            if (service.hasOwnProperty(method)) {
                try {
                    service[method].apply(service, args);
                } catch (e) {
                    console.warn(e.message);
                }
            }
        }
        service.length = 0;
        i = 0;
        len = listeners.length;
        for (i; i < len; i++) {
            listeners[i]();
        }
    };

    init('@@methods');
})();