/**
 * This will take an http call and mask it so it will call a function
 * that can intercept the response with pre an post processors.
 * if a call without an adapter is made when interceptors are enabled it will throw a warning.
 * if you want to suppress the warnings. Then you should define a "warn" function on the
 * options object to handle the warning.
 */
internal('http.interceptor', ['http', 'parseRoute', 'functionArgs'], function (http, parseRoute, functionArgs) {

    var registry = [], result;

    function matchInterceptor(options) {
        var i, len = registry.length, interceptor, result, values, method, interceptorUrl;
        for (i = 0; i < len; i += 1) {
            interceptor = registry[i];
            if (interceptor.type === "string") {
                method = null;
                interceptorUrl = interceptor.matcher.replace(/^\w+\s+/, function (match) {
                    method = match.trim();
                    return '';
                });
                if (method && options.method.toLowerCase() !== method.toLowerCase()) {
                    result = undefined;
                } else {
                    // this will match params that are in /:id/ form and ?a=1 form.
                    // it will require every params in the pattern to match.
                    result = parseRoute.match(interceptorUrl, options.url);
                    if (result) {
                        values = parseRoute.extractParams(interceptorUrl, options.url);
                        options.params = values.params;
                        options.query = values.query;
                    }
                }
            } else if (interceptor.type === "object") {
                result = options.url.match(interceptor.matcher);
            } else if (interceptor.type === "function") {
                result = interceptor.matcher(options);
            }
            if (result) {
                result = interceptor;
                break;
            }
        }
        return result;
    }

    function warn() {
        if (window.console && console.warn) {
            console.warn.apply(console, arguments);
        }
    }

    function execInterceptorMethod(interceptor, method, req, res, next) {
        var args = functionArgs(interceptor[method]);
        if (args.indexOf('next') === -1) {
            interceptor[method](req, res);
            next();
        } else {
            interceptor[method](req, res, next);
        }
    }

    function addIntercept(matcher, preCallHandler, postCallHandler) {
        registry.push({matcher: matcher, type: typeof matcher, pre: preCallHandler, post: postCallHandler});
    }

    function removeIntercept(matcher) {
        // TODO: make find matcher and remove it. (remove all that it matches)
    }

    function intercept(options, Request) {
        var interceptor = matchInterceptor(options), response, warning = warn,
            sent = false,
            res = {},
            responseAPI = {
                status: function (value) {
                    res.status = value;
                },
                send: function (data) {
                    res.data = data;
                    preNext();
                }
            };

        if (options.warn) {
            warning = options.warn;
        }

        function preNext() {
            if (!sent) {
                sent = true;
                if (res.data === undefined) {// they didn't define it. So we still make the call.
                    response = new Request(options);
                    if (interceptor.post) {
                        response.xhr.onloadInterceptor = function (next, result) {
                            for (var i in result) {
                                if (result.hasOwnProperty(i) && res[i] === undefined) {
                                    res[i] = result[i];
                                }
                            }
                            execInterceptorMethod(interceptor, 'post', options, res, next);
                        };
                    }
                } else if (interceptor.post) {
                    execInterceptorMethod(interceptor, 'post', options, res, postNext);
                }
            }
        }

        function postNext() {
            res.status = res.status || 200;
            if (options.success && res.status >= 200 && res.status <= 299) {
                options.success(res);
            } else if (options.error) {
                options.error(res);
            } else {
                warning("Invalid options object for http.");
            }
        }

        if (interceptor && interceptor.pre) {
            execInterceptorMethod(interceptor, 'pre', options, responseAPI, preNext);
            return true;
        }

        warning("No adapter found for " + options.url + ".");
        return false;
    }

    http.intercept = intercept;// if you include it. you get it from here.
    return {add: addIntercept, remove: removeIntercept};
});