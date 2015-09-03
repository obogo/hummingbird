(function () {
    var service = [];
    var initListeners = [];
    var readyListeners = [];

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

        window['@@namespace'] = service;
        parseBaseUrl();
    }

    // Create an async script element for analytics.js based on your API key.
    var script = document.createElement('script'),
        ns = '@@namespace',
        name = ns + '.js'.split('/').pop();
    script.type = 'text/javascript';
    script.async = true;
    script.onload = script.onerror = function () {
        setTimeout(function() {
            var i, len;
            // call pending functions
            i = 0;
            len = service.length;
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
        });
    };
    function parseBaseUrl() {
        var i, tags = document.querySelectorAll('script'), n;

        for(i = 0; i < tags.length; i++) {
            n = tags[i].src.split('/');
            if (n.pop() === name) {
                n = window[ns].baseUrl = n.join('/') + '/';
                script.src = n + '@@url'.split('/').pop();
                console.log(script.src);
                break;
            }
        }
        if (!script.src) {
            script.src = name;
        }
    };
    init('@@methods');
})();