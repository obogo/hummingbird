define('mock', ['http', 'jsonp'], function (http, jsonp) {

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
            var mock = matchMock(options), response, onload;

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
                    warn("Invalid options object for http.");
                }
            }

            if (mock && mock.pre) {
                mock.pre(preNext, options, http);
                return true;
            }

            warn("No adapter found for " + options.url + ".");
            return false;
        }
    };

    return result;

});