/**
 * This will take an http call and mask it so it will call a function
 * that can mock the response with pre an post processors.
 * if a call without an adapter is made when mocks are enabled it will throw a warning.
 * if you want to suppress the warnings. Then you should define a "warn" function on the
 * options object to handle the warning.
 */
internal('http.interceptor', ['http', 'parseRoute', 'functionArgs'], function (http, parseRoute, functionArgs) {

    var registry = [], result;

    function matchInterceptor(options) {
        var i, len = registry.length, mock, result, values;
        for (i = 0; i < len; i += 1) {
            mock = registry[i];
            if (mock.type === "string") {
                var method, mockUrl = mock.matcher.replace(/^\w+\s+/, function(match) {
                    method = match.trim();
                    return '';
                });
                if (method && options.method.toLowerCase() !== method.toLowerCase()) {
                    result = undefined;
                } else {
                    // this will match params that are in /:id/ form and ?a=1 form.
                    // it will require every params in the pattern to match.
                    result = parseRoute.match(mockUrl, options.url);
                    if (result) {
                        values = parseRoute.extractParams(mockUrl, options.url);
                        options.params = values.params;
                        options.query = values.query;
                    }
                }
            } else if (mock.type === "object") {
                result = options.url.match(mock.matcher);
            } else if (mock.type === "function") {
                result = mock.matcher(options);
            }
            if (result) {
                result = mock;
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

    function runArgs(mock, method, req, res, next) {
        var args = functionArgs(mock[method]);
        if (args.indexOf('next') === -1) {
            mock[method](req, res);
            next();
        } else {
            mock[method](req, res, next);
        }
    }

    result = {
        create: function (matcher, preCallHandler, postCallHandler) {
            registry.push({matcher: matcher, type: typeof matcher, pre: preCallHandler, post: postCallHandler});
        },
        handle: function (options, Request) {
            var mock = matchInterceptor(options), response, warning = warn,
                sent = false,
                res = {},
                responseAPI = {
                    status: function(value) {
                        res.status = value;
                    },
                    send: function(data) {
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
                        options.method = "GET";
                        response = new Request(options);
                        if (mock.post) {
                            response.xhr.onloadInterceptor = function (next, result) {
                                for (var i in result) {
                                    if (result.hasOwnProperty(i) && res[i] === undefined) {
                                        res[i] = result[i];
                                    }
                                }
                                runArgs(mock, 'post', options, res, next);
                            };
                        }
                    } else if (mock.post) {
                        runArgs(mock, 'post', options, res, postNext);
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

            if (mock && mock.pre) {
                runArgs(mock, 'pre', options, responseAPI, preNext);
                return true;
            }

            warning("No adapter found for " + options.url + ".");
            return false;
        }
    };

    return result;
});