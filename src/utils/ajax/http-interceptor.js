/**
 * This will take an http call and mask it so it will call a function
 * that can intercept the response with pre an post processors.
 */
internal('http.interceptor', ['http', 'parseRoute', 'functionArgs'], function (http, parseRoute, functionArgs) {

    var registry = [], result;

    function matchInterceptor(options) {
        var i, len = registry.length, interceptor, result, values, method, interceptorUrl;

        function onMatch(match) {
            method = match.trim();
            return '';
        }

        for (i = 0; i < len; i += 1) {
            interceptor = registry[i];
            if (interceptor.type === "string") {
                method = null;
                interceptorUrl = interceptor.matcher.replace(/^\w+\s+/, onMatch);
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

    // remove any matchers that are exact matches.
    function removeIntercept(matcher) {
        var i, len = registry.length;
        for(i = 0; i < len; i += 1) {
            if (registry[i].matcher === matcher) {
                registry.splice(i, 1);
                i -= 1;
                len -= 1;
            }
        }
    }

    function intercept(options, Request) {
        var interceptor = matchInterceptor(options), response,
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
            }
        }

        if (interceptor && interceptor.pre) {
            execInterceptorMethod(interceptor, 'pre', options, responseAPI, preNext);
            return true;
        }
        // no interceptor found
        return false;
    }

    http.intercept = intercept;// if you include it. you get it from here.
    return {add: addIntercept, remove: removeIntercept};
});