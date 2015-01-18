(function () {
    var service = [];

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

        // Find the first script element on the page and insert our script next to it.
        var firstScript = document.getElementsByTagName('script')[0];
        firstScript.parentNode.insertBefore(script, firstScript);

        //window['@@namespace'] = service;
        window['hb'] = service;
    }

    // Create an async script element for analytics.js based on your API key.
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    //script.src = '@@widgetJsUrl';
    script.src = 'hb.js';
    script.onload = script.onerror = function () {

        // TMP
        service.dispatcher(service);

        var len = service.length;
        for (var i = 0; i < len; i++) {
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

        service.dispatch('load::done');
    };

    //init('@@methods');
    init('on');
})();


//(function () {
//    var n = 'hb';
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
//        s.src = 'hb.js';
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