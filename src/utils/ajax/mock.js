/**
 * This will take an http call and mask it so it will call a function
 * that can mock the response with pre an post processors.
 * if a call without an adapter is made when mocks are enabled it will throw a warning.
 * if you want to suppress the warnings. Then you should define a "warn" function on the
 * options object to handle the warning.
 */
internal('http.mock', ['http'], function (http) {

    var registry = [], result;

    function matchMock(options) {
        var i, len = registry.length, mock, result;
        for (i = 0; i < len; i += 1) {
            mock = registry[i];
            if (mock.type === "string" || mock.type === "object") {
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

    http.mock = function (value) {
        http.mocker = value ? result : null;
    };

    result = {
        create: function (matcher, preCallHandler, postCallHandler) {
            registry.push({matcher: matcher, type: typeof matcher, pre: preCallHandler, post: postCallHandler});
        },
        handle: function (options, Request) {
            var mock = matchMock(options), response, onload, warning = warn;

            if (options.warn) {
                warning = options.warn;
            }

            function preNext() {
                if (options.data === undefined) {// they didn't define it. So we still make the call.
                    options.method = "GET";
                    response = new Request(options);
                    if (mock.post) {
                        onload = response.xhr.onload;
                        response.xhr.onload = function () {
                            mock.post(function () {
                                onload.apply(response.xhr);
                            }, options, result);
                        };
                    }
                } else if (mock.post) {
                    mock.post(postNext, options, http);
                }
            }

            function postNext() {
                options.status = options.status || 200;
                if (options.success && options.status >= 200 && options.status <= 299) {
                    options.success(options);
                } else if (options.error) {
                    options.error(options);
                } else {
                    warning("Invalid options object for http.");
                }
            }

            if (mock && mock.pre) {
                mock.pre(preNext, options, http);
                return true;
            }

            warning("No adapter found for " + options.url + ".");
            return false;
        }
    };

    return result;
});