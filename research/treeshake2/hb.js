(function(exports, global) {
    global["hb"] = exports;
    var throwErrors = true, init = true, unresolved = [], internalCache = {}, required = [];
    function saveDefinition(key, dependencies, func, cache) {
        if (throwErrors && cache[key]) {
            throw new Error(key + " is already in use.");
        }
        if (typeof dependencies === "function") {
            cache[key] = dependencies.call(exports);
        } else {
            var fn = func;
            fn.$inject = dependencies;
            unresolved.push({
                key: key,
                fn: fn,
                cache: cache
            });
        }
    }
    function define(key, dependencies, func) {
        saveDefinition(key, dependencies, func, exports);
    }
    function internal(key, dependencies, func) {
        saveDefinition(key, dependencies, func, internalCache);
    }
    function require() {
        var args = Array.prototype.slice.call(arguments);
        var fn = args.pop();
        fn.$inject = args;
        unresolved.push({
            fn: fn,
            cache: exports
        });
        if (!init) {
            resolveAll();
        }
    }
    function acquire(name) {
        return exports[name] || internalCache[name];
    }
    function resolveDependencies(list) {
        var i, len = list.length, ary = list.slice(0);
        for (i = 0; i < len; i += 1) {
            ary[i] = acquire(ary[i]);
            if (!ary[i]) {
                return false;
            }
        }
        return ary;
    }
    function resolve(item) {
        var args, result;
        if (item && item.fn.$inject && (args = resolveDependencies(item.fn.$inject))) {
            result = item.fn.apply(exports, args);
            if (item.key) {
                item.cache[item.key] = result;
            }
            return true;
        }
        return false;
    }
    function resolveAll() {
        var i = 0;
        while (unresolved.length && i < unresolved.length) {
            console.log("resolve", i);
            if (resolve(unresolved[i])) {
                unresolved.splice(i, 1);
                i = 0;
            } else {
                i += 1;
            }
        }
    }
    require("http", function(http) {
        var defaultName = "_jsonpcb";
        function getNextName() {
            var i = 0, name = defaultName;
            while (window[name]) {
                name = defaultName + i;
                i += 1;
            }
            return name;
        }
        function createCallback(name, callback, script) {
            window[name] = function(data) {
                delete window[name];
                callback(data);
                document.head.removeChild(script);
            };
        }
        http.jsonp = function(url, success, error) {
            var name = getNextName(), paramsAry, i, script, options = {};
            if (url === undefined) {
                throw new Error("CORS: url must be defined");
            }
            if (typeof url === "object") {
                options = url;
            } else {
                if (typeof success === "function") {
                    options.success = success;
                }
                if (typeof error === "function") {
                    options.error = error;
                }
                options.url = url;
            }
            options.callback = name;
            if (http.handleMock(options)) {
                return;
            }
            script = document.createElement("script");
            script.type = "text/javascript";
            script.onload = function() {
                setTimeout(function() {
                    if (window[name]) {
                        error(url + " failed.");
                    }
                });
            };
            createCallback(name, success, script);
            paramsAry = [];
            for (i in options) {
                if (options.hasOwnProperty(i)) {
                    paramsAry.push(i + "=" + options[i]);
                }
            }
            script.src = url + "?" + paramsAry.join("&");
            document.head.appendChild(script);
        };
        return http;
    });
    define("http", function() {
        var serialize = function(obj) {
            var str = [];
            for (var p in obj) if (obj.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
            return str.join("&");
        };
        var win = window, CORSxhr = function() {
            var xhr;
            if (win.XMLHttpRequest && "withCredentials" in new win.XMLHttpRequest()) {
                xhr = win.XMLHttpRequest;
            } else if (win.XDomainRequest) {
                xhr = win.XDomainRequest;
            }
            return xhr;
        }(), methods = [ "head", "get", "post", "put", "delete" ], i, methodsLength = methods.length, result = {};
        function Request(options) {
            this.init(options);
        }
        function getRequestResult(that) {
            var headers = parseResponseHeaders(this.getAllResponseHeaders());
            var response = this.responseText;
            if (headers.contentType && headers.contentType.indexOf("application/json") !== -1) {
                response = response ? JSON.parse(response) : response;
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
        Request.prototype.init = function(options) {
            var that = this;
            that.xhr = new CORSxhr();
            that.method = options.method;
            that.url = options.url;
            that.success = options.success;
            that.error = options.error;
            that.data = options.data;
            that.headers = options.headers;
            if (options.credentials === true) {
                that.xhr.withCredentials = true;
            }
            that.send();
            return that;
        };
        Request.prototype.send = function() {
            var that = this;
            if (that.method === "GET" && that.data) {
                var concat = that.url.indexOf("?") > -1 ? "&" : "?";
                that.url += concat + serialize(that.data);
            } else {
                that.data = JSON.stringify(that.data);
            }
            if (that.success !== undefined) {
                that.xhr.onload = function() {
                    var result = getRequestResult.call(this, that);
                    if (this.status >= 200 && this.status < 300) {
                        that.success.call(this, result);
                    } else if (that.error !== undefined) {
                        that.error.call(this, result);
                    }
                };
            }
            if (that.error !== undefined) {
                that.xhr.error = function() {
                    var result = getRequestResult.call(this, that);
                    that.error.call(this, result);
                };
            }
            that.xhr.open(that.method, that.url, true);
            if (that.headers !== undefined) {
                that.setHeaders();
            }
            that.xhr.send(that.data, true);
            return that;
        };
        Request.prototype.setHeaders = function() {
            var that = this, headers = that.headers, key;
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
                parts = list[i].split(": ");
                if (parts[0] && parts[1]) {
                    parts[0] = parts[0].split("-").join("").split("");
                    parts[0][0] = parts[0][0].toLowerCase();
                    headers[parts[0].join("")] = parts[1];
                }
                i += 1;
            }
            return headers;
        }
        function addDefaults(options, defaults) {
            for (var i in defaults) {
                if (defaults.hasOwnProperty(i) && options[i] === undefined) {
                    if (typeof defaults[i] === "object") {
                        options[i] = {};
                        addDefaults(options[i], defaults[i]);
                    } else {
                        options[i] = defaults[i];
                    }
                }
            }
            return options;
        }
        function handleMock(options) {
            return !!(result.mocker && result.mocker.handle(options, Request));
        }
        for (i = 0; i < methodsLength; i += 1) {
            (function() {
                var method = methods[i];
                result[method] = function(url, success, error) {
                    var options = {};
                    if (url === undefined) {
                        throw new Error("CORS: url must be defined");
                    }
                    if (typeof url === "object") {
                        options = url;
                    } else {
                        if (typeof success === "function") {
                            options.success = success;
                        }
                        if (typeof error === "function") {
                            options.error = error;
                        }
                        options.url = url;
                    }
                    options.method = method.toUpperCase();
                    addDefaults(options, result.defaults);
                    if (result.handleMock(options)) {
                        return;
                    }
                    return new Request(options).xhr;
                };
            })();
        }
        result.mocker = null;
        result.handleMock = handleMock;
        result.defaults = {
            headers: {}
        };
        return result;
    });
    throwErrors = false;
    init = false;
    resolveAll();
    while (required.length) {
        resolve(required.unshift());
    }
    exports.define = define;
    exports.require = require;
})({}, function() {
    return this;
}());