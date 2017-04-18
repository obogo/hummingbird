/**
 * A module for http calls (similar to jquery.http
 * @export http
 * @desc This is my desc
 */
define('http', ['extend'], function (extend) {

    var serialize = function(obj, prefix) {
        var str = [], p;
        for(p in obj) {
            if (obj.hasOwnProperty(p)) {
                var k = prefix ? prefix + "[" + p + "]" : p, v = obj[p];
                str.push((v !== null && typeof v === "object") ?
                    serialize(v, k) :
                    encodeURIComponent(k) + "=" + encodeURIComponent(v));
            }
        }
        return str.join("&");
    };

    var win = window,
        CORSxhr = (function () {
            var xhr;

            if (win.XMLHttpRequest && ('withCredentials' in new win.XMLHttpRequest())) {
                xhr = win.XMLHttpRequest;

            } else if (win.XDomainRequest) {
                xhr = win.XDomainRequest;
            }

            return xhr;
        }()),
        methods = ['head', 'get', 'post', 'put', 'delete'],
        i,
        methodsLength = methods.length,
        result = {serialize:serialize};

    /**
     * @param options {object}
     * @constructor
     * @alias http
     */
    function Request(options) {
        this.init(options);
    }

    function getRequestResult(that) {
        var headers = parseResponseHeaders(that.xhr.getAllResponseHeaders());
        var response = that.xhr.responseText.trim();
        var start;
        var end;
        if (response) {
            start = response[0];
            end = response[response.length - 1];
        }
        if (response && (start === '{' && end === '}') || (start === '[' && end === ']')) {
            response = response ? JSON.parse(response.replace(/\/\*.*?\*\//g, '')) : response;
        }
        return {
            data: response,
            request: {
                method: that.method,
                url: that.url,
                data: that.data,
                headers: that.headers
            },
            headers: headers,
            status: this.status
        };
    }

    Request.prototype.init = function (options) {
        var that = this;

        that.xhr = new CORSxhr();
        that.method = options.method;
        that.url = options.url;
        that.success = options.success;
        that.error = options.error;
        that.data = options.data;
        that.headers = options.headers;
        that.timeout = options.timeout;
        that.ontimeout = options.ontimeout;
        that.async = options.async === undefined ? true : options.async;

        if (options.credentials === true) {
            that.xhr.withCredentials = true;
        }

        that.send();

        return that;
    };

    Request.prototype.send = function () {
        var that = this;

        // serialize data if GET
        if (that.method === 'GET' && that.data) {
            var concat = that.url.indexOf('?') > -1 ? '&' : '?';
            that.url += concat + serialize(that.data);
        } else {
            that.data = JSON.stringify(that.data);
        }

        // Success callback
        if (that.success !== undefined) {
            that.xhr.onload = function () {
                var result = getRequestResult.call(that.xhr, that),
                    self = this;
                function onLoad() {
                    if (that.xhr.status >= 200 && that.xhr.status < 400) {
                        that.success.call(self, result);
                    } else if (that.error !== undefined) {
                        that.error.call(self, result);
                    }
                }
                if (this.onloadInterceptor) {
                    this.onloadInterceptor(onLoad, result);
                } else {
                    onLoad();
                }
            };
        }

        // Timeout
        if(that.timeout) {
            that.xhr.timeout = that.timeout;
            that.xhr.ontimeout = function() {
                    var result = getRequestResult.call(that.xhr, that);
                    if(that.ontimeout) {
                        that.ontimeout.call(this, result);
                    } else if(that.error) {
                        that.error.call(this, result);
                    }
                };
        }

        // Error callback
        if (that.error !== undefined) {
            that.xhr.onerror = function () {
                var result = getRequestResult.call(that.xhr, that);
                that.error.call(this, result);
            };
        }

        that.xhr.open(that.method, that.url, that.async);

        if (that.headers !== undefined) {
            that.setHeaders();
        }

        // Send
        that.xhr.send(that.data);

        return that;
    };

    Request.prototype.setHeaders = function () {
        var that = this,
            headers = that.headers,
            key;

        for (key in headers) {
            if (headers.hasOwnProperty(key)) {
                that.xhr.setRequestHeader(key, headers[key]);
            }
        }

        return that;
    };

    function parseResponseHeaders(str) {
        var list = str.split("\n");
        var headers = {};
        var parts;
        var i = 0, len = list.length;
        while (i < len) {
            parts = list[i].split(': ');
            if (parts[0] && parts[1]) {
                parts[0] = parts[0].split('-').join('').split('');
                parts[0][0] = parts[0][0].toLowerCase();
                headers[parts[0].join('')] = parts[1];
            }
            i += 1;
        }
        return headers;
    }

    function addDefaults(options, defaults) {
        return extend(options, defaults);
    }

    function handleInterceptor(options) {
        return !!(result.intercept && result.intercept(options, Request));
    }

    /**
     * Public Methods
     */
    for (i = 0; i < methodsLength; i += 1) {
        /* jshint ignore:start */
        (function () {
            var method = methods[i];
            result[method] = function (url, success, error) {
                var options = {};

                if (url === undefined) {
                    throw new Error('CORS: url must be defined');
                }

                if (typeof url === 'object') {
                    options = url;
                } else {
                    if (typeof success === 'function') {
                        options.success = success;
                    }
                    if (typeof error === 'function') {
                        options.error = error;
                    }

                    options.url = url;
                }

                options.method = method.toUpperCase();
                addDefaults(options, result.defaults);
                if (handleInterceptor(options)) {
                    return;
                }
                return new Request(options).xhr;
            };
        }());
        /* jshint ignore:end */
    }

    result.intercept = null; // to show where to assign interceptor handlers.
    result.defaults = {
        headers: {}
    };

    return result;

});