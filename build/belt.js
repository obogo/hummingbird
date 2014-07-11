/*
* belt v.0.1.5
* WebUX. MIT 2014
*/
(function(exports, global) {
    global["belt"] = exports;
    var aggregators = {};
    var ajax = {};
    var async = {};
    var crypt = {};
    var browser = {};
    var data = {};
    var display = {};
    var formatters = {};
    var geom = {};
    var parsers = {};
    var patterns = {};
    var query;
    (function() {
        var fn;
        function Query(selector, context) {
            this.init(selector, context);
        }
        var queryPrototype = Query.prototype = Object.create(Array.prototype);
        queryPrototype.version = "0.1.2";
        queryPrototype.selector = "";
        queryPrototype.init = function(selector, context) {
            if (typeof selector === "string") {
                if (selector.substr(0, 1) === "<" && selector.substr(selector.length - 1, 1) === ">") {
                    this.parseHTML(selector);
                } else {
                    this.parseSelector(selector, context);
                }
            } else if (selector instanceof Array) {
                this.parseArray(selector);
            } else if (selector instanceof Element) {
                this.parseElement(selector);
            }
        };
        queryPrototype.parseHTML = function(html) {
            var container = document.createElement("div");
            container.innerHTML = html;
            this.length = 0;
            this.parseArray(container.children);
        };
        queryPrototype.parseSelector = function(selector, context) {
            var i, nodes, len;
            this.selector = selector;
            if (context instanceof Element) {
                this.context = context;
            } else if (context instanceof Query) {
                this.context = context[0];
            } else {
                this.context = document;
            }
            nodes = this.context.querySelectorAll(selector);
            len = nodes.length;
            i = 0;
            this.length = 0;
            while (i < len) {
                this.push(nodes[i]);
                i += 1;
            }
        };
        queryPrototype.parseArray = function(list) {
            var i = 0, len = list.length;
            this.length = 0;
            while (i < len) {
                if (list[i] instanceof Element) {
                    this.push(list[i]);
                }
                i += 1;
            }
        };
        queryPrototype.parseElement = function(element) {
            this.length = 0;
            this.push(element);
        };
        queryPrototype.toString = function() {
            if (this.length) {
                return this[0].outerHTML;
            }
        };
        queryPrototype.each = function(fn) {
            var i = 0, len = this.length, result;
            while (i < len) {
                result = fn.apply(this[i], [ i, this[i] ]);
                if (result === false) {
                    break;
                }
                i += 1;
            }
            return this;
        };
        query = function(selector, context) {
            for (var n in query.fn) {
                if (query.fn.hasOwnProperty(n)) {
                    queryPrototype[n] = query.fn[n];
                    delete query.fn[n];
                }
            }
            return new Query(selector, context);
        };
        query.fn = {};
    })();
    var timers = {};
    var validators = {};
    var xml = {};
    ajax.cors = function() {
        var win = window, CORSxhr = function() {
            var xhr;
            if (win.XMLHttpRequest && "withCredentials" in new win.XMLHttpRequest()) {
                xhr = win.XMLHttpRequest;
            } else if (win.XDomainRequest) {
                xhr = win.XDomainRequest;
            }
            return xhr;
        }(), methods = [ "head", "get", "post", "put", "delete" ], i = 0, methodsLength = methods.length, result = {};
        function Request(options) {
            this.init(options);
        }
        Request.prototype.init = function(options) {
            var that = this;
            that.xhr = new CORSxhr();
            that.method = options.method;
            that.url = options.url;
            that.success = options.success;
            that.error = options.error;
            that.params = JSON.stringify(options.params);
            that.headers = options.headers;
            if (options.credentials === true) {
                that.xhr.withCredentials = true;
            }
            that.send();
            return that;
        };
        Request.prototype.send = function() {
            var that = this;
            if (that.success !== undefined) {
                that.xhr.onload = function() {
                    that.success.call(this, this.responseText);
                };
            }
            if (that.error !== undefined) {
                that.xhr.error = function() {
                    that.error.call(this, this.responseText);
                };
            }
            that.xhr.open(that.method, that.url, true);
            if (that.headers !== undefined) {
                that.setHeaders();
            }
            that.xhr.send(that.params, true);
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
        for (i; i < methodsLength; i += 1) {
            (function() {
                var method = methods[i];
                result[method] = function(url, success) {
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
                        options.url = url;
                    }
                    options.method = method.toUpperCase();
                    return new Request(options).xhr;
                };
            })();
        }
        return result;
    }();
    async.defer = function(undef) {
        var nextTick, isFunc = function(f) {
            return typeof f === "function";
        }, isArray = function(a) {
            return Array.isArray ? Array.isArray(a) : a instanceof Array;
        }, isObjOrFunc = function(o) {
            return !!(o && (typeof o).match(/function|object/));
        }, isNotVal = function(v) {
            return v === false || v === undef || v === null;
        }, slice = function(a, offset) {
            return [].slice.call(a, offset);
        }, undefStr = "undefined", tErr = typeof TypeError === undefStr ? Error : TypeError;
        if (typeof process !== undefStr && process.nextTick) {
            nextTick = process.nextTick;
        } else if (typeof MessageChannel !== undefStr) {
            var ntickChannel = new MessageChannel(), queue = [];
            ntickChannel.port1.onmessage = function() {
                queue.length && queue.shift()();
            };
            nextTick = function(cb) {
                queue.push(cb);
                ntickChannel.port2.postMessage(0);
            };
        } else {
            nextTick = function(cb) {
                setTimeout(cb, 0);
            };
        }
        function rethrow(e) {
            nextTick(function() {
                throw e;
            });
        }
        function promise_success(fulfilled) {
            return this.then(fulfilled, undef);
        }
        function promise_error(failed) {
            return this.then(undef, failed);
        }
        function promise_apply(fulfilled, failed) {
            return this.then(function(a) {
                return isFunc(fulfilled) ? fulfilled.apply(null, isArray(a) ? a : [ a ]) : defer.onlyFuncs ? a : fulfilled;
            }, failed || undef);
        }
        function promise_ensure(cb) {
            function _cb() {
                cb();
            }
            this.then(_cb, _cb);
            return this;
        }
        function promise_nodify(cb) {
            return this.then(function(a) {
                return isFunc(cb) ? cb.apply(null, isArray(a) ? a.splice(0, 0, undefined) && a : [ undefined, a ]) : defer.onlyFuncs ? a : cb;
            }, function(e) {
                return cb(e);
            });
        }
        function promise_rethrow(failed) {
            return this.then(undef, failed ? function(e) {
                failed(e);
                throw e;
            } : rethrow);
        }
        var defer = function(alwaysAsync) {
            var alwaysAsyncFn = (undef !== alwaysAsync ? alwaysAsync : defer.alwaysAsync) ? nextTick : function(fn) {
                fn();
            }, status = 0, pendings = [], value, _promise = {
                then: function(fulfilled, failed) {
                    var d = defer();
                    pendings.push([ function(value) {
                        try {
                            if (isNotVal(fulfilled)) {
                                d.resolve(value);
                            } else {
                                d.resolve(isFunc(fulfilled) ? fulfilled(value) : defer.onlyFuncs ? value : fulfilled);
                            }
                        } catch (e) {
                            d.reject(e);
                        }
                    }, function(err) {
                        if (isNotVal(failed) || !isFunc(failed) && defer.onlyFuncs) {
                            d.reject(err);
                        }
                        if (failed) {
                            try {
                                d.resolve(isFunc(failed) ? failed(err) : failed);
                            } catch (e) {
                                d.reject(e);
                            }
                        }
                    } ]);
                    status !== 0 && alwaysAsyncFn(execCallbacks);
                    return d.promise;
                },
                success: promise_success,
                error: promise_error,
                otherwise: promise_error,
                apply: promise_apply,
                spread: promise_apply,
                ensure: promise_ensure,
                nodify: promise_nodify,
                rethrow: promise_rethrow,
                isPending: function() {
                    return !!(status === 0);
                },
                getStatus: function() {
                    return status;
                }
            };
            _promise.toSource = _promise.toString = _promise.valueOf = function() {
                return value === undef ? this : value;
            };
            function execCallbacks() {
                if (status === 0) {
                    return;
                }
                var cbs = pendings, i = 0, l = cbs.length, cbIndex = ~status ? 0 : 1, cb;
                pendings = [];
                for (;i < l; i++) {
                    (cb = cbs[i][cbIndex]) && cb(value);
                }
            }
            function _resolve(val) {
                var done = false;
                function once(f) {
                    return function(x) {
                        if (done) {
                            return undefined;
                        } else {
                            done = true;
                            return f(x);
                        }
                    };
                }
                if (status) {
                    return this;
                }
                try {
                    var then = isObjOrFunc(val) && val.then;
                    if (isFunc(then)) {
                        if (val === _promise) {
                            throw new tErr("Promise can't resolve itself");
                        }
                        then.call(val, once(_resolve), once(_reject));
                        return this;
                    }
                } catch (e) {
                    once(_reject)(e);
                    return this;
                }
                alwaysAsyncFn(function() {
                    value = val;
                    status = 1;
                    execCallbacks();
                });
                return this;
            }
            function _reject(Err) {
                status || alwaysAsyncFn(function() {
                    try {
                        throw Err;
                    } catch (e) {
                        value = e;
                    }
                    status = -1;
                    execCallbacks();
                });
                return this;
            }
            return {
                promise: _promise,
                resolve: _resolve,
                fulfill: _resolve,
                reject: _reject
            };
        };
        defer.deferred = defer.defer = defer;
        defer.nextTick = nextTick;
        defer.alwaysAsync = true;
        defer.onlyFuncs = true;
        defer.resolved = defer.fulfilled = function(value) {
            return defer(true).resolve(value).promise;
        };
        defer.rejected = function(reason) {
            return defer(true).reject(reason).promise;
        };
        defer.wait = function(time) {
            var d = defer();
            setTimeout(d.resolve, time || 0);
            return d.promise;
        };
        defer.delay = function(fn, delay) {
            var d = defer();
            setTimeout(function() {
                try {
                    d.resolve(fn.apply(null));
                } catch (e) {
                    d.reject(e);
                }
            }, delay || 0);
            return d.promise;
        };
        defer.promisify = function(promise) {
            if (promise && isFunc(promise.then)) {
                return promise;
            }
            return defer.resolved(promise);
        };
        function multiPromiseResolver(callerArguments, returnPromises) {
            var promises = slice(callerArguments);
            if (promises.length === 1 && isArray(promises[0])) {
                if (!promises[0].length) {
                    return defer.fulfilled([]);
                }
                promises = promises[0];
            }
            var args = [], d = defer(), c = promises.length;
            if (!c) {
                d.resolve(args);
            } else {
                var resolver = function(i) {
                    promises[i] = defer.promisify(promises[i]);
                    promises[i].then(function(v) {
                        if (!(i in args)) {
                            args[i] = returnPromises ? promises[i] : v;
                            --c || d.resolve(args);
                        }
                    }, function(e) {
                        if (!(i in args)) {
                            if (!returnPromises) {
                                d.reject(e);
                            } else {
                                args[i] = promises[i];
                                --c || d.resolve(args);
                            }
                        }
                    });
                };
                for (var i = 0, l = c; i < l; i++) {
                    resolver(i);
                }
            }
            return d.promise;
        }
        defer.all = function() {
            return multiPromiseResolver(arguments, false);
        };
        defer.resolveAll = function() {
            return multiPromiseResolver(arguments, true);
        };
        defer.nodeCapsule = function(subject, fn) {
            if (!fn) {
                fn = subject;
                subject = void 0;
            }
            return function() {
                var d = defer(), args = slice(arguments);
                args.push(function(err, res) {
                    err ? d.reject(err) : d.resolve(arguments.length > 2 ? slice(arguments, 1) : res);
                });
                try {
                    fn.apply(subject, args);
                } catch (e) {
                    d.reject(e);
                }
                return d.promise;
            };
        };
        return defer;
    }();
    async.dispatcher = function(target, scope, map) {
        var listeners = {};
        function off(event, callback) {
            var index, list;
            list = listeners[event];
            if (list) {
                if (callback) {
                    index = list.indexOf(callback);
                    if (index !== -1) {
                        list.splice(index, 1);
                    }
                } else {
                    list.length = 0;
                }
            }
        }
        function on(event, callback) {
            listeners[event] = listeners[event] || [];
            listeners[event].push(callback);
            return function() {
                off(event, callback);
            };
        }
        function once(event, callback) {
            function fn() {
                off(event, fn);
                callback.apply(scope || target, arguments);
            }
            return on(event, fn);
        }
        function getListeners(event) {
            return listeners[event];
        }
        function fire(callback, args) {
            return callback && callback.apply(target, args);
        }
        function dispatch(event) {
            if (listeners[event]) {
                var i = 0, list = listeners[event], len = list.length;
                while (i < len) {
                    fire(list[i], arguments);
                    i += 1;
                }
            }
        }
        if (scope && map) {
            target.on = scope[map.on] && scope[map.on].bind(scope);
            target.off = scope[map.off] && scope[map.off].bind(scope);
            target.once = scope[map.once] && scope[map.once].bind(scope);
            target.dispatch = scope[map.dispatch].bind(scope);
        } else {
            target.on = on;
            target.off = off;
            target.once = once;
            target.dispatch = dispatch;
        }
        target.getListeners = getListeners;
    };
    async.waterfall = function(args, callbacks, resultHandler) {
        function callback() {
            if (callbacks.length) {
                var cb = callbacks.shift();
                cb.apply(null, formatters.toArgsArray(arguments).concat(callback));
            } else {
                var args = formatters.toArgsArray(arguments);
                args.unshift(null);
                if (resultHandler) {
                    resultHandler.apply(null, args);
                }
            }
        }
        args = args || [];
        callback.apply(null, args.concat(callback));
    };
    browser.cookie = function() {
        var cookie = function() {
            return cookie.get.apply(cookie, arguments);
        };
        var utils = cookie.utils = {
            isArray: Array.isArray || function(value) {
                return Object.prototype.toString.call(value) === "[object Array]";
            },
            isPlainObject: function(value) {
                return !!value && Object.prototype.toString.call(value) === "[object Object]";
            },
            toArray: function(value) {
                return Array.prototype.slice.call(value);
            },
            getKeys: Object.keys || function(obj) {
                var keys = [], key = "";
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        keys.push(key);
                    }
                }
                return keys;
            },
            escape: function(value) {
                return String(value).replace(/[,;"\\=\s%]/g, function(character) {
                    return encodeURIComponent(character);
                });
            },
            retrieve: function(value, fallback) {
                return value === null ? fallback : value;
            }
        };
        cookie.defaults = {};
        cookie.expiresMultiplier = 60 * 60 * 24;
        cookie.set = function(key, value, options) {
            if (utils.isPlainObject(key)) {
                for (var k in key) {
                    if (key.hasOwnProperty(k)) {
                        this.set(k, key[k], value);
                    }
                }
            } else {
                options = utils.isPlainObject(options) ? options : {
                    expires: options
                };
                var expires = options.expires !== undefined ? options.expires : this.defaults.expires || "", expiresType = typeof expires;
                if (expiresType === "string" && expires !== "") {
                    expires = new Date(expires);
                } else if (expiresType === "number") {
                    expires = new Date(+new Date() + 1e3 * this.expiresMultiplier * expires);
                }
                if (expires !== "" && "toGMTString" in expires) {
                    expires = ";expires=" + expires.toGMTString();
                }
                var path = options.path || this.defaults.path;
                path = path ? ";path=" + path : "";
                var domain = options.domain || this.defaults.domain;
                domain = domain ? ";domain=" + domain : "";
                var secure = options.secure || this.defaults.secure ? ";secure" : "";
                document.cookie = utils.escape(key) + "=" + utils.escape(value) + expires + path + domain + secure;
            }
            return this;
        };
        cookie.remove = function(keys) {
            keys = utils.isArray(keys) ? keys : utils.toArray(arguments);
            for (var i = 0, l = keys.length; i < l; i++) {
                this.set(keys[i], "", -1);
            }
            return this;
        };
        cookie.empty = function() {
            return this.remove(utils.getKeys(this.all()));
        };
        cookie.get = function(keys, fallback) {
            fallback = fallback || undefined;
            var cookies = this.all();
            if (utils.isArray(keys)) {
                var result = {};
                for (var i = 0, l = keys.length; i < l; i++) {
                    var value = keys[i];
                    result[value] = utils.retrieve(cookies[value], fallback);
                }
                return result;
            } else {
                return utils.retrieve(cookies[keys], fallback);
            }
        };
        cookie.all = function() {
            if (document.cookie === "") {
                return {};
            }
            var cookies = document.cookie.split("; "), result = {};
            for (var i = 0, l = cookies.length; i < l; i++) {
                var item = cookies[i].split("=");
                result[decodeURIComponent(item[0])] = decodeURIComponent(item[1]);
            }
            return result;
        };
        cookie.enabled = function() {
            if (navigator.cookieEnabled) {
                return true;
            }
            var ret = cookie.set("_", "_").get("_") === "_";
            cookie.remove("_");
            return ret;
        };
        return cookie;
    }();
    browser.localStorage = function() {
        var api = {
            events: {
                WARNING: "localStorage:warning",
                ERROR: "localStorage:error"
            },
            UNSUPPORTED: "LOCAL_STORAGE_NOT_SUPPORTED"
        }, prefix = "runner:";
        function browserSupportsLocalStorage() {
            try {
                return "localStorage" in window && window.localStorage !== null;
            } catch (e) {
                api.dispatch(api.events.ERROR, e.Description);
                return false;
            }
        }
        function localStorageEnabled() {
            try {
                var has = browserSupportsLocalStorage(), key = "__localStorageSupportTest__", r;
                if (has) {
                    r = Date.now().toString();
                    localStorage.setItem(key, r);
                    return localStorage.getItem(key) === r;
                }
            } catch (e) {
                api.dispatch(api.events.ERROR, e.Description);
                return false;
            }
        }
        function addToLocalStorage(key, value) {
            if (!browserSupportsLocalStorage()) {
                api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                return false;
            }
            if (!value && value !== 0 && value !== "") return false;
            try {
                localStorage.setItem(prefix + key, JSON.stringify(value));
            } catch (e) {
                api.dispatch(api.events.ERROR, e.Description);
                return false;
            }
            return true;
        }
        function getFromLocalStorage(key) {
            if (!browserSupportsLocalStorage()) {
                api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                return false;
            }
            var item = localStorage.getItem(prefix + key);
            if (!item) return null;
            return JSON.parse(item);
        }
        function removeFromLocalStorage(key) {
            if (!browserSupportsLocalStorage()) {
                api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                return false;
            }
            try {
                localStorage.removeItem(prefix + key);
            } catch (e) {
                api.dispatch(api.events.ERROR, e.Description);
                return false;
            }
            return true;
        }
        function getAllFromLocalStorageByPrefix(localPrefix) {
            if (!browserSupportsLocalStorage()) {
                api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                return false;
            }
            var prefixKey = prefix + (localPrefix || ""), prefixKeyLength = prefixKey.length, prefixLength = prefix.length, localKey, result = {};
            for (var key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.substr(0, prefixKeyLength) === prefixKey) {
                    localKey = key.substr(prefixLength);
                    result[localKey] = getFromLocalStorage(localKey);
                }
            }
            return result;
        }
        function clearAllFromLocalStorage(pattern) {
            if (!browserSupportsLocalStorage()) {
                api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                return false;
            }
            var prefixLength = prefix.length;
            for (var key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.substr(0, prefixLength) === prefix && (!pattern || key.substr(prefixLength).match(pattern))) {
                    try {
                        removeFromLocalStorage(key.substr(prefixLength));
                    } catch (e) {
                        api.dispatch(api.events.ERROR, e.Description);
                        return false;
                    }
                }
            }
            return true;
        }
        api.isSupported = browserSupportsLocalStorage;
        api.enabled = localStorageEnabled;
        api.put = addToLocalStorage;
        api.get = getFromLocalStorage;
        api.getAll = getAllFromLocalStorageByPrefix;
        api.remove = removeFromLocalStorage;
        api.clearAll = clearAllFromLocalStorage;
        return api;
    }();
    (function() {
        var callbacks = [];
        browser.ready = function(callback) {
            callbacks.push(callback);
        };
        var DOMContentLoaded;
        function invokeCallbacks() {
            var i = 0, len = callbacks.length;
            while (i < len) {
                callbacks[i]();
                i += 1;
            }
            callbacks.length = 0;
        }
        if (document.addEventListener) {
            DOMContentLoaded = function() {
                document.removeEventListener("DOMContentLoaded", DOMContentLoaded, false);
                invokeCallbacks();
            };
        } else if (document.attachEvent) {
            DOMContentLoaded = function() {
                if (document.readyState === "complete") {
                    document.detachEvent("onreadystatechange", DOMContentLoaded);
                    invokeCallbacks();
                }
            };
        }
        if (document.readyState === "complete") {
            setTimeout(invokeCallbacks, 1);
        }
        if (document.addEventListener) {
            document.addEventListener("DOMContentLoaded", DOMContentLoaded, false);
            window.addEventListener("load", invokeCallbacks, false);
        } else if (document.attachEvent) {
            document.attachEvent("onreadystatechange", DOMContentLoaded);
            window.attachEvent("onload", invokeCallbacks);
        }
    })();
    crypt.md5 = function() {
        function safe_add(x, y) {
            var lsw = (x & 65535) + (y & 65535), msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return msw << 16 | lsw & 65535;
        }
        function bit_rol(num, cnt) {
            return num << cnt | num >>> 32 - cnt;
        }
        function md5_cmn(q, a, b, x, s, t) {
            return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
        }
        function md5_ff(a, b, c, d, x, s, t) {
            return md5_cmn(b & c | ~b & d, a, b, x, s, t);
        }
        function md5_gg(a, b, c, d, x, s, t) {
            return md5_cmn(b & d | c & ~d, a, b, x, s, t);
        }
        function md5_hh(a, b, c, d, x, s, t) {
            return md5_cmn(b ^ c ^ d, a, b, x, s, t);
        }
        function md5_ii(a, b, c, d, x, s, t) {
            return md5_cmn(c ^ (b | ~d), a, b, x, s, t);
        }
        function binl_md5(x, len) {
            x[len >> 5] |= 128 << len % 32;
            x[(len + 64 >>> 9 << 4) + 14] = len;
            var i, olda, oldb, oldc, oldd, a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
            for (i = 0; i < x.length; i += 16) {
                olda = a;
                oldb = b;
                oldc = c;
                oldd = d;
                a = md5_ff(a, b, c, d, x[i], 7, -680876936);
                d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
                c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
                b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
                a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
                d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
                c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
                b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
                a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
                d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
                c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
                b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
                a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
                d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
                c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
                b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);
                a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
                d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
                c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
                b = md5_gg(b, c, d, a, x[i], 20, -373897302);
                a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
                d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
                c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
                b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
                a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
                d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
                c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
                b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
                a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
                d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
                c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
                b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);
                a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
                d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
                c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
                b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
                a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
                d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
                c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
                b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
                a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
                d = md5_hh(d, a, b, c, x[i], 11, -358537222);
                c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
                b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
                a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
                d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
                c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
                b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);
                a = md5_ii(a, b, c, d, x[i], 6, -198630844);
                d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
                c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
                b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
                a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
                d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
                c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
                b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
                a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
                d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
                c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
                b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
                a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
                d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
                c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
                b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);
                a = safe_add(a, olda);
                b = safe_add(b, oldb);
                c = safe_add(c, oldc);
                d = safe_add(d, oldd);
            }
            return [ a, b, c, d ];
        }
        function binl2rstr(input) {
            var i, output = "";
            for (i = 0; i < input.length * 32; i += 8) {
                output += String.fromCharCode(input[i >> 5] >>> i % 32 & 255);
            }
            return output;
        }
        function rstr2binl(input) {
            var i, output = [];
            output[(input.length >> 2) - 1] = undefined;
            for (i = 0; i < output.length; i += 1) {
                output[i] = 0;
            }
            for (i = 0; i < input.length * 8; i += 8) {
                output[i >> 5] |= (input.charCodeAt(i / 8) & 255) << i % 32;
            }
            return output;
        }
        function rstr_md5(s) {
            return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
        }
        function rstr_hmac_md5(key, data) {
            var i, bkey = rstr2binl(key), ipad = [], opad = [], hash;
            ipad[15] = opad[15] = undefined;
            if (bkey.length > 16) {
                bkey = binl_md5(bkey, key.length * 8);
            }
            for (i = 0; i < 16; i += 1) {
                ipad[i] = bkey[i] ^ 909522486;
                opad[i] = bkey[i] ^ 1549556828;
            }
            hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
            return binl2rstr(binl_md5(opad.concat(hash), 512 + 128));
        }
        function rstr2hex(input) {
            var hex_tab = "0123456789abcdef", output = "", x, i;
            for (i = 0; i < input.length; i += 1) {
                x = input.charCodeAt(i);
                output += hex_tab.charAt(x >>> 4 & 15) + hex_tab.charAt(x & 15);
            }
            return output;
        }
        function str2rstr_utf8(input) {
            return unescape(encodeURIComponent(input));
        }
        function raw_md5(s) {
            return rstr_md5(str2rstr_utf8(s));
        }
        function hex_md5(s) {
            return rstr2hex(raw_md5(s));
        }
        function raw_hmac_md5(k, d) {
            return rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d));
        }
        function hex_hmac_md5(k, d) {
            return rstr2hex(raw_hmac_md5(k, d));
        }
        function md5(string, key, raw) {
            if (!key) {
                if (!raw) {
                    return hex_md5(string);
                }
                return raw_md5(string);
            }
            if (!raw) {
                return hex_hmac_md5(key, string);
            }
            return raw_hmac_md5(key, string);
        }
        return md5;
    }();
    data.cache = function() {
        var Cache, ns;
        ns = {};
        Cache = function() {
            var _cachedItems = [];
            this.set = function(key, value) {
                _cachedItems[key] = value;
                return value;
            };
            this.get = function(key, defaultValue, overwrite) {
                if (_.has(_cachedItems, key)) {
                    return _cachedItems[key];
                }
                if (overwrite) {
                    this.set(key, defaultValue);
                }
                return defaultValue;
            };
            this.getCopy = function(key, defaultValue, overwrite) {
                var data = this.get(key, defaultValue, overwrite);
                return _.clone(data);
            };
            this.merge = function(key, value) {
                if (_cachedItems[key]) {
                    _cachedItems[key] = _.extend(_cachedItems[key], value);
                } else {
                    _cachedItems[key] = value;
                }
                return _cachedItems[key];
            };
            this.keys = function() {
                var keys = [];
                for (var key in _cachedItems) {
                    if (_cachedItems.hasOwnProperty(key)) {
                        keys.push(key);
                    }
                }
                return keys;
            };
            this.all = function() {
                return _cachedItems;
            };
            this.has = function(key) {
                return _.has(_cachedItems, key);
            };
            this.remove = function(key) {
                delete _cachedItems[key];
            };
            this.clear = function() {
                _cachedItems = {};
            };
            this.inc = function(key) {
                var id = key + "Counter";
                if (!_cachedItems[id]) {
                    _cachedItems[id] = 0;
                }
                _cachedItems[id] += 1;
                return _cachedItems[id];
            };
            this.dec = function(key) {
                var id = key + "Counter";
                if (!_cachedItems[id]) {
                    _cachedItems[id] = 0;
                }
                _cachedItems[id] -= 1;
                return _cachedItems[id];
            };
        };
        return function(name) {
            name = name || "__default__";
            if (!ns[name]) {
                ns[name] = new Cache();
            }
            return ns[name];
        };
    };
    data.copy = function(source, destination, stackSource, stackDest) {
        if (validators.isWindow(source)) {
            throw Error("Can't copy! Making copies of Window instances is not supported.");
        }
        if (!destination) {
            destination = source;
            if (source) {
                if (validators.isArray(source)) {
                    destination = data.copy(source, [], stackSource, stackDest);
                } else if (validators.isDate(source)) {
                    destination = new Date(source.getTime());
                } else if (validators.isRegExp(source)) {
                    destination = new RegExp(source.source);
                } else if (validators.isObject(source)) {
                    destination = data.copy(source, {}, stackSource, stackDest);
                }
            }
        } else {
            if (source === destination) {
                throw Error("Can't copy! Source and destination are identical.");
            }
            stackSource = stackSource || [];
            stackDest = stackDest || [];
            if (validators.isObject(source)) {
                var index = stackSource.indexOf(source);
                if (index !== -1) {
                    return stackDest[index];
                }
                stackSource.push(source);
                stackDest.push(destination);
            }
            var result;
            if (validators.isArray(source)) {
                destination.length = 0;
                for (var i = 0; i < source.length; i++) {
                    result = data.copy(source[i], null, stackSource, stackDest);
                    if (validators.isObject(source[i])) {
                        stackSource.push(source[i]);
                        stackDest.push(result);
                    }
                    destination.push(result);
                }
            } else {
                forEach(destination, function(value, key) {
                    delete destination[key];
                });
                for (var key in source) {
                    result = data.copy(source[key], null, stackSource, stackDest);
                    if (validators.isObject(source[key])) {
                        stackSource.push(source[key]);
                        stackDest.push(result);
                    }
                    destination[key] = result;
                }
            }
        }
        return destination;
    };
    data.diff = function(source, target) {
        var returnVal = {}, dateStr;
        for (var name in target) {
            if (name in source) {
                if (validators.isDate(target[name])) {
                    dateStr = validators.isDate(source[name]) ? source[name].toISOString() : source[name];
                    if (target[name].toISOString() !== dateStr) {
                        returnVal[name] = target[name];
                    }
                } else if (validators.isObject(target[name]) && !validators.isArray(target[name])) {
                    var diff = data.diff(source[name], target[name]);
                    if (!validators.isEmpty(diff)) {
                        returnVal[name] = diff;
                    }
                } else if (!validators.isEqual(source[name], target[name])) {
                    returnVal[name] = target[name];
                }
            } else {
                returnVal[name] = target[name];
            }
        }
        if (validators.isEmpty(returnVal)) {
            return null;
        }
        return returnVal;
    };
    data.shallowCopy = function(src, dest, ignorePrefix) {
        if (validators.isArray(src)) {
            dest = dest || [];
            for (var i = 0; i < src.length; i++) {
                dest[i] = src[i];
            }
        } else if (validators.isObject(src)) {
            dest = dest || {};
            for (var key in src) {
                if (hasOwnProperty.call(src, key) && !(key.charAt(0) === ignorePrefix && key.charAt(1) === ignorePrefix)) {
                    dest[key] = src[key];
                }
            }
        }
        return dest || src;
    };
    data.uuid = function(pattern) {
        return (pattern || "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").replace(/[xy]/g, function(b) {
            var d = 16 * Math.random() | 0;
            return ("x" == b ? d : d & 3 | 8).toString(16);
        });
    };
    (function() {
        var sorting;
        var AdjacentBottomAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var bottomEdge = bounds.bottom();
                var length = targets.length;
                while (length--) {
                    targets[length].y(bottomEdge);
                }
            };
        };
        var AdjacentBottomLeftAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var bottomEdge = bounds.bottom();
                var leftEdge = bounds.left();
                var length = targets.length;
                while (length--) {
                    var target = targets[length];
                    target.x(leftEdge - target.width());
                    target.y(bottomEdge);
                }
            };
        };
        var AdjacentBottomRightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var bottomEdge = bounds.bottom();
                var rightEdge = bounds.right();
                var length = targets.length;
                while (length--) {
                    var item = targets[length];
                    item.x(rightEdge);
                    item.y(bottomEdge);
                }
            };
        };
        var AdjacentHorizontalLeftAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var centerX = bounds.left() + bounds.width() * .5;
                var length = targets.length;
                while (length--) {
                    targets[length].x(centerX - targets[length].width());
                }
            };
        };
        var AdjacentHorizontalRightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var centerX = bounds.left() + bounds.width() * .5;
                var length = targets.length;
                while (length--) {
                    targets[length].x(centerX);
                }
            };
        };
        var AdjacentLeftAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var leftEdge = bounds.left();
                var length = targets.length;
                while (length--) {
                    targets[length].x(leftEdge - targets[length].width());
                }
            };
        };
        var AdjacentRightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var rightEdge = bounds.right();
                var length = targets.length;
                while (length--) {
                    targets[length].x(rightEdge);
                }
            };
        };
        var AdjacentTopAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var topEdge = bounds.top();
                var length = targets.length;
                while (length--) {
                    targets[length].y(topEdge - targets[length].height());
                }
            };
        };
        var AdjacentTopLeftAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var topEdge = bounds.top();
                var leftEdge = bounds.left();
                var length = targets.length;
                while (length--) {
                    var target = targets[length];
                    target.x(leftEdge - target.width());
                    target.y(topEdge - target.height());
                }
            };
        };
        var AdjacentTopRightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var topEdge = bounds.top();
                var rightEdge = bounds.right();
                var length = targets.length;
                while (length--) {
                    var target = targets[length];
                    target.x(rightEdge);
                    target.y(topEdge - target.height());
                }
            };
        };
        var AdjacentVerticalBottomAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var centerY = bounds.centerY();
                var length = targets.length;
                while (length--) {
                    targets[length].y(centerY);
                }
            };
        };
        var AdjacentVerticalTopAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var centerY = bounds.centerY();
                var length = targets.length;
                while (length--) {
                    targets[length].y(centerY - targets[length].height());
                }
            };
        };
        var BottomAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var bottomEdge = bounds.bottom();
                var length = targets.length;
                while (length--) {
                    targets[length].val("y", bottomEdge - targets[length].height);
                }
            };
        };
        var BottomLeftAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var bottomEdge = bounds.bottom();
                var leftEdge = bounds.left();
                var length = targets.length;
                while (length--) {
                    targets[length].x(leftEdge);
                    targets[length].y(bottomEdge - targets[length].height());
                }
            };
        };
        var BottomRightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var bottomEdge = bounds.bottom();
                var rightEdge = bounds.right();
                var length = targets.length;
                while (length--) {
                    var target = targets[length];
                    target.x(rightEdge - target.width());
                    target.y(bottomEdge - target.height());
                }
            };
        };
        var CenterAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var centerX = bounds.centerX();
                var centerY = bounds.centerY();
                var length = targets.length;
                while (length--) {
                    var target = targets[length];
                    target.x(centerX - target.width() * .5);
                    target.y(centerY - target.height() * .5);
                }
            };
        };
        var DistributeBottomAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                targets.sort(sorting.sortRectBottom);
                var length = targets.length;
                var first = bounds.top() + targets[0].bounds.height;
                var spread = (bounds.bottom() - first) / (length - 1);
                while (length--) {
                    targets[length].val("y", first - targets[length].bounds.height + spread * length);
                }
            };
        };
        var DistributeHorizontalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                targets = targets.sort(sorting.sortRectCenterX);
                var length = targets.length;
                var first = bounds.left() + targets[0].bounds.width * .5;
                var last = bounds.right() - targets[targets.length - 1].width * .5;
                var spread = (last - first) / (length - 1);
                while (length--) {
                    targets[length].val("x", first - targets[length].bounds.width * .5 + spread * length);
                }
            };
        };
        var DistributeLeftAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                targets = targets.sort(sorting.sortRectLeft);
                var leftEdge = bounds.left();
                var spread = (bounds.width - targets[targets.length - 1].bounds.width) / (targets.length - 1);
                var length = targets.length;
                while (length--) {
                    targets[length].val("x", leftEdge + spread * length);
                }
            };
        };
        var DistributeRightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                targets.sort(sorting.sortRectRight);
                var leftEdge = bounds.left();
                var first = leftEdge + targets[0].bounds.width;
                var spread = (bounds.right() - first) / (targets.length - 1);
                var length = targets.length;
                while (length--) {
                    targets[length].val("x", first - targets[length].bounds.width + spread * length);
                }
            };
        };
        var DistributeTopAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                targets = targets.sort(sorting.sortRectTop);
                var length = targets.length;
                var first = bounds.top();
                var spread = (bounds.bottom() - targets[length - 1].bounds.height - first) / (length - 1);
                while (length--) {
                    targets[length].val("y", first + spread * length);
                }
            };
        };
        var DistributeVerticalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                targets = targets.sort(sorting.sortRectCenterY);
                var length = targets.length;
                var first = bounds.top() + targets[0].bounds.height * .5;
                var last = bounds.bottom() - targets[length - 1].bounds.height * .5;
                var spread = (last - first) / (length - 1);
                while (length--) {
                    targets[length].val("y", first - targets[length].bounds.height * .5 + spread * length);
                }
            };
        };
        var HorizontalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var mid = bounds.left() + bounds.width * .5;
                var length = targets.length;
                while (length--) {
                    targets[length].val("x", mid - targets[length].bounds.width * .5);
                }
            };
        };
        var LeftAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var leftEdge = bounds.left();
                var length = targets.length;
                while (length--) {
                    targets[length].val("x", leftEdge);
                }
            };
        };
        var MatchHeightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var endH = bounds.height;
                var length = targets.length;
                while (length--) {
                    targets[length].val("height", endH);
                }
            };
        };
        var MatchSizeAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var endW = bounds.width;
                var endH = bounds.height;
                var length = targets.length;
                while (length--) {
                    targets[length].val("width", endW);
                    targets[length].val("height", endH);
                }
            };
        };
        var MatchWidthAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var endW = bounds.width;
                var length = targets.length;
                while (length--) {
                    targets[length].val("width", endW);
                }
            };
        };
        var RightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var rightEdge = bounds.right();
                var length = targets.length;
                while (length--) {
                    targets[length].val("x", rightEdge - targets[length].bounds.width);
                }
            };
        };
        var ScaleToFillAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var width = bounds.width();
                var height = bounds.height();
                var ratio = width / height;
                var length = targets.length;
                while (length--) {
                    var item = targets[length];
                    var itemWHRatio = item.width() / item.height();
                    var itemHWRatio = item.height() / item.width();
                    if (itemWHRatio > ratio) {
                        item.height(height);
                        item.width(height / itemHWRatio);
                    } else if (itemWHRatio < ratio) {
                        item.width(width);
                        item.height(width / itemWHRatio);
                    } else {
                        item.width(width);
                        item.height(height);
                    }
                }
            };
        };
        var ScaleToFitAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var width = bounds.width();
                var height = bounds.height();
                var ratio = width / height;
                var length = targets.length;
                while (length--) {
                    var item = targets[length];
                    var itemWHRatio = item.width() / item.height();
                    var itemHWRatio = item.height() / item.width();
                    if (itemWHRatio > ratio) {
                        item.width(width);
                        item.height(width / itemWHRatio);
                    } else if (itemWHRatio < ratio) {
                        item.height(height);
                        item.width(height / itemHWRatio);
                    } else {
                        item.width(width);
                        item.height(height);
                    }
                }
            };
        };
        var SpaceHorizontalAligner = function() {
            this.alignRectangles = function(bounds, targets, spread) {
                targets = targets.concat();
                targets = targets.sort(sorting.sortRectLeft);
                var objsWidth = 0;
                var totalWidth = bounds.width;
                var length = targets.length;
                while (length--) {
                    objsWidth += targets[length].bounds.width;
                }
                length = targets.length;
                spread = spread !== undefined ? spread : (totalWidth - objsWidth) / (length - 1);
                spread = Number(spread);
                var right = bounds.left() + targets[0].bounds.width;
                targets[0].val("x", bounds.left());
                for (var j = 1; j < length; j++) {
                    var item = targets[j];
                    item.val("x", right + spread);
                    right += item.bounds.width + spread;
                }
            };
        };
        var SpaceInsideHorizontalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                targets = targets.sort(sorting.sortRectLeft);
                var objsWidth = 0;
                var totalWidth = bounds.width();
                var length = targets.length;
                while (length--) {
                    objsWidth += targets[length].width();
                }
                var spread = (totalWidth - objsWidth) / (length + 1);
                var right = bounds.left();
                for (var j = 0; j < length; j++) {
                    var item = targets[j];
                    item.x(right + spread);
                    right += item.width() + spread;
                }
            };
        };
        var SpaceInsideVerticalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                targets = targets.sort(sorting.sortRectTop);
                var objsHeight = 0;
                var totalHeight = bounds.height();
                var length = targets.length;
                while (length--) {
                    objsHeight += targets[length].height();
                }
                var spread = (totalHeight - objsHeight) / (length + 1);
                var bottom = bounds.top();
                for (var j = 0; j < length; j++) {
                    var target = targets[j];
                    target.y(bottom + spread);
                    bottom += target.height() + spread;
                }
            };
        };
        var SpaceVerticalAligner = function() {
            this.alignRectangles = function(bounds, targets, spread) {
                targets = targets.concat();
                targets = targets.sort(sorting.sortRectTop);
                var targetTotalHeight = 0;
                var totalHeight = bounds.height;
                var length = targets.length;
                while (length--) {
                    targetTotalHeight += targets[length].bounds.height;
                }
                length = targets.length;
                spread = spread !== undefined ? spread : (totalHeight - targetTotalHeight) / (length - 1);
                var bottom = bounds.top() + targets[0].bounds.height;
                targets[0].val("y", bounds.top());
                for (var j = 1; j < length; j++) {
                    var item = targets[j];
                    item.val("y", bottom + spread);
                    bottom += item.bounds.height + spread;
                }
            };
        };
        var TopAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var topEdge = bounds.top();
                var length = targets.length;
                while (length--) {
                    targets[length].val("y", topEdge);
                }
            };
        };
        var TopLeftAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var topEdge = bounds.top();
                var leftEdge = bounds.left();
                var length = targets.length;
                while (length--) {
                    targets[length].y(topEdge);
                    targets[length].x(leftEdge);
                }
            };
        };
        var TopRightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var topEdge = bounds.top();
                var rightEdge = bounds.right();
                var length = targets.length;
                while (length--) {
                    targets[length].x(rightEdge - targets[length].width());
                    targets[length].y(topEdge);
                }
            };
        };
        var VerticalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var centerY = bounds.centerY();
                var length = targets.length;
                while (length--) {
                    targets[length].val("y", centerY - targets[length].bounds.height * .5);
                }
            };
        };
        var StackHorizontalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                var before = [];
                var after = [];
                var left = 0;
                var right = 0;
                var item;
                var endX;
                var leftEdge = bounds.left();
                var rightEdge = bounds.right();
                var centerX = bounds.centerX();
                for (var i = 0; i < targets.length; i++) {
                    var target = targets[length];
                    var targetCenterX = target.centerX();
                    if (targetCenterX < centerX) {
                        before.push(targets[length]);
                    } else {
                        after.push(targets[length]);
                    }
                }
                before.sort(sorting.sortRectAdjacentRight);
                after.sort(sorting.sortRectAdjacentLeft);
                before.reverse();
                var firstTarget;
                if (before.length > 0) {
                    firstTarget = before[0];
                    endX = leftEdge - firstTarget.width;
                    left = leftEdge - firstTarget.width;
                    firstTarget.x(endX);
                    for (i = 1; i < before.length; i++) {
                        item = before[i];
                        endX = left - item.width;
                        left -= item.width;
                        item.x(endX);
                    }
                }
                if (after.length > 0) {
                    firstTarget = after[0];
                    endX = rightEdge;
                    right = rightEdge + firstTarget.width;
                    firstTarget.x(endX);
                    for (i = 1; i < after.length; i++) {
                        item = after[i];
                        endX = right;
                        right += item.width;
                        item.x(endX);
                    }
                }
            };
        };
        var StackVerticalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                var above = [];
                var below = [];
                var centerY = bounds.centerY();
                for (var i = 0; i < targets.length; i++) {
                    var target = targets[length];
                    var targetCenterY = target.centerY();
                    if (targetCenterY < centerY) {
                        above.push(targets[length]);
                    } else {
                        below.push(targets[length]);
                    }
                }
                above.sort(sorting.sortRectAdjacentTop);
                below.sort(sorting.sortRectAdjacentBottom);
                above.reverse();
                var top = 0;
                var bottom = 0;
                var item;
                var endY;
                for (var j = 0; j < above.length; j++) {
                    item = above[j];
                    if (j !== 0) {
                        endY = top - item.height();
                        top -= item.height();
                    } else {
                        endY = bounds.top() - item.height();
                        top = bounds.top() - item.height();
                    }
                    item.y(endY);
                }
                for (var k = 0; k < below.length; k++) {
                    item = below[k];
                    if (k !== 0) {
                        endY = bottom;
                        bottom += item.height();
                    } else {
                        endY = bounds.bottom();
                        bottom = bounds.bottom();
                    }
                    item.y(endY);
                }
            };
        };
        var FlipHorizontalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var leftEdge = bounds.left();
                var rightEdge = bounds.right();
                var length = targets.length;
                while (length--) {
                    targets[length].val("x", leftEdge + rightEdge - targets[length].bounds.x - targets[length].bounds.width);
                }
            };
        };
        var Align = function() {
            sorting = new dash.display.Sorting();
            this.left = new LeftAligner();
            this.horizontal = new HorizontalAligner();
            this.right = new RightAligner();
            this.top = new TopAligner();
            this.vertical = new VerticalAligner();
            this.bottom = new BottomAligner();
            this.center = new CenterAligner();
            this.topLeft = new TopLeftAligner();
            this.topRight = new TopRightAligner();
            this.bottomLeft = new BottomLeftAligner();
            this.bottomRight = new BottomRightAligner();
            this.adjacentLeft = new AdjacentLeftAligner();
            this.adjacentHorizontalLeft = new AdjacentHorizontalLeftAligner();
            this.adjacentHorizontalRight = new AdjacentHorizontalRightAligner();
            this.adjacentRight = new AdjacentRightAligner();
            this.adjacentTop = new AdjacentTopAligner();
            this.adjacentVerticalTop = new AdjacentVerticalTopAligner();
            this.adjacentVerticalBottom = new AdjacentVerticalBottomAligner();
            this.adjacentBottom = new AdjacentBottomAligner();
            this.adjacentTopLeft = new AdjacentTopLeftAligner();
            this.adjacentTopRight = new AdjacentTopRightAligner();
            this.adjacentBottomLeft = new AdjacentBottomLeftAligner();
            this.adjacentBottomRight = new AdjacentBottomRightAligner();
            this.distributeLeft = new DistributeLeftAligner();
            this.distributeHorizontal = new DistributeHorizontalAligner();
            this.distributeRight = new DistributeRightAligner();
            this.distributeTop = new DistributeTopAligner();
            this.distributeVertical = new DistributeVerticalAligner();
            this.distributeBottom = new DistributeBottomAligner();
            this.matchWidth = new MatchWidthAligner();
            this.matchHeight = new MatchHeightAligner();
            this.matchSize = new MatchSizeAligner();
            this.scaleToFit = new ScaleToFitAligner();
            this.scaleToFill = new ScaleToFillAligner();
            this.spaceHorizontal = new SpaceHorizontalAligner();
            this.spaceInsideHorizontal = new SpaceInsideHorizontalAligner();
            this.spaceVertical = new SpaceVerticalAligner();
            this.spaceInsideVertical = new SpaceInsideVerticalAligner();
            this.stackHorizontal = new StackHorizontalAligner();
            this.stackVertical = new StackVerticalAligner();
            this.flipHorizontal = new FlipHorizontalAligner();
        };
        display.Align = Align;
    })();
    (function() {
        display.Sorting = function() {
            var that = this;
            that.compareNumber = function(a, b) {
                return a > b ? 1 : a < b ? -1 : 0;
            };
            that.sortRectWidth = function(a, b) {
                return that.compareNumber(a.bounds.width, b.bounds.width);
            };
            that.sortRectHeight = function(a, b) {
                return that.compareNumber(a.bounds.height, b.bounds.height);
            };
            that.sortRectLeft = function(a, b) {
                return that.compareNumber(a.bounds.left(), b.bounds.left());
            };
            that.sortRectRight = function(a, b) {
                return that.compareNumber(a.bounds.right(), b.bounds.right());
            };
            that.sortRectTop = function(a, b) {
                return that.compareNumber(a.bounds.top(), b.bounds.top());
            };
            that.sortRectBottom = function(a, b) {
                return that.compareNumber(a.bounds.bottom(), b.bounds.bottom());
            };
            that.sortRectCenterX = function(a, b) {
                return that.compareNumber(a.bounds.centerX(), b.bounds.centerX());
            };
            that.sortRectCenterY = function(a, b) {
                return that.compareNumber(a.bounds.centerY(), b.bounds.centerY());
            };
            that.sortRectAdjacentLeft = function(a, b) {
                var i = that.sortRectLeft(a, b);
                if (i === 0) {
                    i = that.sortRectRight(a, b);
                }
                return i;
            };
            that.sortRectAdjacentRight = function(a, b) {
                var i = that.sortRectRight(a, b);
                if (i === 0) {
                    i = that.sortRectLeft(a, b);
                }
                return i;
            };
            that.sortRectAdjacentTop = function(a, b) {
                var i = that.sortRectTop(a, b);
                if (i === 0) {
                    i = that.sortRectBottom(a, b);
                }
                return i;
            };
            that.sortRectAdjacentBottom = function(a, b) {
                var i = that.sortRectBottom(a, b);
                if (i === 0) {
                    i = that.sortRectTop(a, b);
                }
                return i;
            };
        };
    })();
    formatters.toArgsArray = function(args) {
        return Array.prototype.slice.call(args, 0);
    };
    formatters.toArray = function(value) {
        try {
            if (validators.isArray(value)) {
                return value;
            }
            if (!validators.isUndefined(value)) {
                return [].concat(value);
            }
        } catch (e) {}
        return [];
    };
    formatters.toObject = function(value) {
        if (validators.isUndefined(value)) {
            return {};
        }
        if (validators.isObject(value)) {
            return value;
        }
        return {
            value: value
        };
    };
    formatters.toString = function() {
        var value = [];
        forEach(this, function(e) {
            value.push("" + e);
        });
        return "[" + value.join(", ") + "]";
    };
    var debounce = function(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                timeout = null;
                if (!immediate) {
                    func.apply(context, args);
                }
            }, wait);
            if (immediate && !timeout) {
                func.apply(context, args);
            }
        };
    };
    var forEach = function(obj, iterator, context) {
        var key;
        if (obj) {
            if (validators.isFunction(obj)) {
                for (key in obj) {
                    if (key != "prototype" && key != "length" && key != "name" && (!obj.hasOwnProperty || obj.hasOwnProperty(key))) {
                        iterator.call(context, obj[key], key);
                    }
                }
            } else if (obj.forEach && obj.forEach !== forEach) {
                obj.forEach(iterator, context);
            } else if (validators.isArrayLike(obj)) {
                for (key = 0; key < obj.length; key++) iterator.call(context, obj[key], key);
            } else {
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        iterator.call(context, obj[key], key);
                    }
                }
            }
        }
        return obj;
    };
    var getName = function(fn) {
        var f = typeof fn === "function";
        var s = f && (fn.name && [ "", fn.name ] || fn.toString().match(/function ([^\(]+)/));
        return !f && "not a function" || (s && s[1] || "anonymous");
    };
    var throttle = function(func, threshhold, scope) {
        threshhold = threshhold || 250;
        var last, deferTimer;
        return function() {
            var context = scope || this;
            var now = +new Date(), args = arguments;
            if (last && now < last + threshhold) {
                clearTimeout(deferTimer);
                deferTimer = setTimeout(function() {
                    last = now;
                    func.apply(context, args);
                }, threshhold);
            } else {
                last = now;
                func.apply(context, args);
            }
        };
    };
    geom.Rect = function(x, y, width, height) {
        this.x = x || 0;
        this.y = y || 0;
        this.width = width || 0;
        this.height = height || 0;
        this.source = function(value) {
            if (value) {
                this.x = value.x || 0;
                this.y = value.y || 0;
                this.width = value.width || 0;
                this.height = value.height || 0;
            }
            return this;
        };
        this.pos = function(point) {
            if (point) {
                this.x = point.x || 0;
                this.y = point.y || 0;
            }
            return {
                x: this.x,
                y: this.y
            };
        };
        this.size = function(point) {
            if (point) {
                this.width = point.x || point.width || 0;
                this.height = point.y || point.height || 0;
            }
            return {
                x: this.width,
                y: this.height
            };
        };
        this.top = function() {
            return Number(this.y);
        };
        this.left = function() {
            return Number(this.x);
        };
        this.topLeft = function() {
            return {
                x: Number(this.x),
                y: Number(this.y)
            };
        };
        this.bottom = function() {
            return Number(this.y) + Number(this.height);
        };
        this.right = function() {
            return Number(this.x) + Number(this.width);
        };
        this.bottomRight = function() {
            return {
                x: Number(this.x) + Number(this.width),
                y: Number(this.y) + Number(this.height)
            };
        };
        this.centerX = function() {
            return Number(this.x) + this.width * .5;
        };
        this.centerY = function() {
            return Number(this.y) + this.height * .5;
        };
        this.clone = function() {
            return new geom.Rect(Number(this.x), Number(this.y), Number(this.width), Number(this.height));
        };
        this.contains = function(x, y) {
            x = Number(x);
            y = Number(y);
            return x >= Number(this.x) && x < Number(this.x) + Number(this.width) && y >= Number(this.y) && y < Number(this.y) + Number(this.height);
        };
        this.containsPoint = function(point) {
            return Number(point.x) >= Number(this.x) && Number(point.x) < Number(this.x) + Number(this.width) && Number(point.y) >= Number(this.y) && Number(point.y) < Number(this.y) + Number(this.height);
        };
        this.containsRect = function(rect) {
            var rRect = rect.source();
            var r1 = Number(rRect.x) + Number(rRect.width);
            var b1 = Number(rRect.y) + Number(rRect.height);
            var r2 = Number(this.x) + Number(this.width);
            var b2 = Number(this.y) + Number(this.height);
            return Number(rRect.x) >= Number(this.x) && Number(rRect.x) < r2 && Number(rRect.y) >= Number(this.y) && Number(rRect.y) < b2 && r1 > Number(this.x) && r1 <= r2 && b1 > Number(this.y) && b1 <= b2;
        };
        this.copyFrom = function(sourceRect) {
            this.x = Number(sourceRect.x || 0);
            this.y = Number(sourceRect.y || 0);
            this.width = Number(sourceRect.width || 0);
            this.height = Number(sourceRect.height || 0);
        };
        this.equals = function(toCompare) {
            return Number(toCompare.x) === Number(this.x) && Number(toCompare.y) === Number(this.y) && Number(toCompare.width) === Number(this.width) && Number(toCompare.height) === Number(this.height);
        };
        this.inflate = function(dx, dy) {
            dx = Number(dx);
            dy = Number(dy);
            this.x = Number(this.x) - dx;
            this.width = Number(this.width) + 2 * dx;
            this.y = Number(this.y) - dy;
            this.height = Number(this.height) + 2 * dy;
        };
        this.inflatePoint = function(point) {
            this.x = Number(this.x) - Number(point.x);
            this.width = Number(this.width) + 2 * point.x;
            this.y = Number(this.y) - Number(point.y);
            this.height = Number(this.height) + 2 * point.y;
        };
        this.intersection = function(toIntersect) {
            if (this.isEmpty() || toIntersect.isEmpty()) {
                return new geom.Rect();
            }
            var resultX = Math.max(Number(this.x), Number(toIntersect.x));
            var resultY = Math.max(Number(this.y), Number(toIntersect.y));
            var resultWidth = Math.min(Number(this.x) + Number(this.width), Number(toIntersect.x) + Number(toIntersect.width)) - resultX;
            var resultHeight = Math.min(Number(this.y) + Number(this.height), Number(toIntersect.y) + Number(toIntersect.height)) - resultY;
            if (resultWidth <= 0 || resultHeight <= 0) {
                return new geom.Rect();
            }
            return new geom.Rect(resultX, resultY, resultWidth, resultHeight);
        };
        this.intersects = function(toIntersect) {
            if (this.isEmpty() || toIntersect.isEmpty()) {
                return false;
            }
            var thisX = Number(this.x);
            var thisY = Number(this.y);
            var thisW = Number(this.width);
            var thisH = Number(this.height);
            var intX = Number(toIntersect.x);
            var intY = Number(toIntersect.y);
            var intW = Number(toIntersect.width);
            var intH = Number(toIntersect.height);
            var resultX = Math.max(thisX, intX);
            var resultY = Math.max(thisY, intY);
            var resultWidth = Math.min(thisX + thisW, intX + intW) - resultX;
            var resultHeight = Math.min(thisY + thisH, intY + intH) - resultY;
            if (resultWidth <= 0 || resultHeight <= 0) {
                return false;
            }
            return true;
        };
        this.isEmpty = function() {
            return Number(this.width) <= 0 || Number(this.height) <= 0;
        };
        this.offset = function(dx, dy) {
            this.x = Number(this.x) + Number(dx);
            this.y = Number(this.y) + Number(dy);
        };
        this.offsetPoint = function(point) {
            this.x = Number(this.x) + Number(point.x);
            this.y = Number(this.y) + Number(point.y);
        };
        this.setEmpty = function() {
            this.x = 0;
            this.y = 0;
            this.width = 0;
            this.height = 0;
        };
        this.toString = function() {
            return "(x=" + this.x + ", y=" + this.y + ", w=" + this.width + ", h=" + this.height + ")";
        };
        this.union = function(toUnion) {
            var r, rect2;
            if (this.isEmpty()) {
                return toUnion.clone();
            }
            if (toUnion.isEmpty()) {
                return this.clone();
            }
            r = {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            };
            rect2 = toUnion.source();
            r.x = Math.min(Number(this.x), Number(rect2.x));
            r.y = Math.min(Number(this.y), Number(rect2.y));
            r.width = Math.max(Number(this.x) + Number(this.width), Number(rect2.x) + Number(rect2.width)) - r.x;
            r.height = Math.max(Number(this.y) + Number(this.height), Number(rect2.y) + Number(rect2.height)) - r.y;
            return new geom.Rect(r.x, r.y, r.width, r.height);
        };
    };
    parsers.getUrls = function(str, type) {
        var urls, i, len;
        if (typeof str === "string") {
            var rx = new RegExp('=\\"([^\\"]+\\.(' + type + ')\\")', "gi");
            urls = str.match(rx);
            for (i = 0, len = urls ? urls.length : 0; i < len; ++i) {
                urls[i] = urls[i].replace(/(\"|=)/g, "");
            }
        }
        return urls || [];
    };
    parsers.interpolate = function() {
        function setter(obj, path, setValue, fullExp, options) {
            options = options || {};
            var element = path.split("."), key;
            for (var i = 0; element.length > 1; i++) {
                key = ensureSafeMemberName(element.shift(), fullExp);
                var propertyObj = obj[key];
                if (!propertyObj) {
                    propertyObj = {};
                    obj[key] = propertyObj;
                }
                obj = propertyObj;
                if (obj.then && options.unwrapPromises) {
                    promiseWarning(fullExp);
                    if (!("$$v" in obj)) {
                        (function(promise) {
                            promise.then(function(val) {
                                promise.$$v = val;
                            });
                        })(obj);
                    }
                    if (obj.$$v === undefined) {
                        obj.$$v = {};
                    }
                    obj = obj.$$v;
                }
            }
            key = ensureSafeMemberName(element.shift(), fullExp);
            obj[key] = setValue;
            return setValue;
        }
        var getterFnCache = {};
        function cspSafeGetterFn(key0, key1, key2, key3, key4, fullExp, options) {
            ensureSafeMemberName(key0, fullExp);
            ensureSafeMemberName(key1, fullExp);
            ensureSafeMemberName(key2, fullExp);
            ensureSafeMemberName(key3, fullExp);
            ensureSafeMemberName(key4, fullExp);
            return !options.unwrapPromises ? function cspSafeGetter(scope, locals) {
                var pathVal = locals && locals.hasOwnProperty(key0) ? locals : scope;
                if (pathVal == null) return pathVal;
                pathVal = pathVal[key0];
                if (!key1) return pathVal;
                if (pathVal == null) return undefined;
                pathVal = pathVal[key1];
                if (!key2) return pathVal;
                if (pathVal == null) return undefined;
                pathVal = pathVal[key2];
                if (!key3) return pathVal;
                if (pathVal == null) return undefined;
                pathVal = pathVal[key3];
                if (!key4) return pathVal;
                if (pathVal == null) return undefined;
                pathVal = pathVal[key4];
                return pathVal;
            } : function cspSafePromiseEnabledGetter(scope, locals) {
                var pathVal = locals && locals.hasOwnProperty(key0) ? locals : scope, promise;
                if (pathVal == null) return pathVal;
                pathVal = pathVal[key0];
                if (pathVal && pathVal.then) {
                    promiseWarning(fullExp);
                    if (!("$$v" in pathVal)) {
                        promise = pathVal;
                        promise.$$v = undefined;
                        promise.then(function(val) {
                            promise.$$v = val;
                        });
                    }
                    pathVal = pathVal.$$v;
                }
                if (!key1) return pathVal;
                if (pathVal == null) return undefined;
                pathVal = pathVal[key1];
                if (pathVal && pathVal.then) {
                    promiseWarning(fullExp);
                    if (!("$$v" in pathVal)) {
                        promise = pathVal;
                        promise.$$v = undefined;
                        promise.then(function(val) {
                            promise.$$v = val;
                        });
                    }
                    pathVal = pathVal.$$v;
                }
                if (!key2) return pathVal;
                if (pathVal == null) return undefined;
                pathVal = pathVal[key2];
                if (pathVal && pathVal.then) {
                    promiseWarning(fullExp);
                    if (!("$$v" in pathVal)) {
                        promise = pathVal;
                        promise.$$v = undefined;
                        promise.then(function(val) {
                            promise.$$v = val;
                        });
                    }
                    pathVal = pathVal.$$v;
                }
                if (!key3) return pathVal;
                if (pathVal == null) return undefined;
                pathVal = pathVal[key3];
                if (pathVal && pathVal.then) {
                    promiseWarning(fullExp);
                    if (!("$$v" in pathVal)) {
                        promise = pathVal;
                        promise.$$v = undefined;
                        promise.then(function(val) {
                            promise.$$v = val;
                        });
                    }
                    pathVal = pathVal.$$v;
                }
                if (!key4) return pathVal;
                if (pathVal == null) return undefined;
                pathVal = pathVal[key4];
                if (pathVal && pathVal.then) {
                    promiseWarning(fullExp);
                    if (!("$$v" in pathVal)) {
                        promise = pathVal;
                        promise.$$v = undefined;
                        promise.then(function(val) {
                            promise.$$v = val;
                        });
                    }
                    pathVal = pathVal.$$v;
                }
                return pathVal;
            };
        }
        function simpleGetterFn1(key0, fullExp) {
            ensureSafeMemberName(key0, fullExp);
            return function simpleGetterFn1(scope, locals) {
                if (scope == null) return undefined;
                return (locals && locals.hasOwnProperty(key0) ? locals : scope)[key0];
            };
        }
        function simpleGetterFn2(key0, key1, fullExp) {
            ensureSafeMemberName(key0, fullExp);
            ensureSafeMemberName(key1, fullExp);
            return function simpleGetterFn2(scope, locals) {
                if (scope == null) return undefined;
                scope = (locals && locals.hasOwnProperty(key0) ? locals : scope)[key0];
                return scope == null ? undefined : scope[key1];
            };
        }
        function getterFn(path, options, fullExp) {
            if (getterFnCache.hasOwnProperty(path)) {
                return getterFnCache[path];
            }
            var pathKeys = path.split("."), pathKeysLength = pathKeys.length, fn;
            if (!options.unwrapPromises && pathKeysLength === 1) {
                fn = simpleGetterFn1(pathKeys[0], fullExp);
            } else if (!options.unwrapPromises && pathKeysLength === 2) {
                fn = simpleGetterFn2(pathKeys[0], pathKeys[1], fullExp);
            } else if (options.csp) {
                if (pathKeysLength < 6) {
                    fn = cspSafeGetterFn(pathKeys[0], pathKeys[1], pathKeys[2], pathKeys[3], pathKeys[4], fullExp, options);
                } else {
                    fn = function(scope, locals) {
                        var i = 0, val;
                        do {
                            val = cspSafeGetterFn(pathKeys[i++], pathKeys[i++], pathKeys[i++], pathKeys[i++], pathKeys[i++], fullExp, options)(scope, locals);
                            locals = undefined;
                            scope = val;
                        } while (i < pathKeysLength);
                        return val;
                    };
                }
            } else {
                var code = "var p;\n";
                forEach(pathKeys, function(key, index) {
                    ensureSafeMemberName(key, fullExp);
                    code += "if(s == null) return undefined;\n" + "s=" + (index ? "s" : '((k&&k.hasOwnProperty("' + key + '"))?k:s)') + '["' + key + '"]' + ";\n" + (options.unwrapPromises ? "if (s && s.then) {\n" + ' pw("' + fullExp.replace(/(["\r\n])/g, "\\$1") + '");\n' + ' if (!("$$v" in s)) {\n' + " p=s;\n" + " p.$$v = undefined;\n" + " p.then(function(v) {p.$$v=v;});\n" + "}\n" + " s=s.$$v\n" + "}\n" : "");
                });
                code += "return s;";
                var evaledFnGetter = new Function("s", "k", "pw", code);
                evaledFnGetter.toString = valueFn(code);
                fn = options.unwrapPromises ? function(scope, locals) {
                    return evaledFnGetter(scope, locals, promiseWarning);
                } : evaledFnGetter;
            }
            if (path !== "hasOwnProperty") {
                getterFnCache[path] = fn;
            }
            return fn;
        }
        "use strict";
        var OPERATORS = {
            "null": function() {
                return null;
            },
            "true": function() {
                return true;
            },
            "false": function() {
                return false;
            },
            undefined: noop,
            "+": function(self, locals, a, b) {
                a = a(self, locals);
                b = b(self, locals);
                if (isDefined(a)) {
                    if (isDefined(b)) {
                        return a + b;
                    }
                    return a;
                }
                return isDefined(b) ? b : undefined;
            },
            "-": function(self, locals, a, b) {
                a = a(self, locals);
                b = b(self, locals);
                return (isDefined(a) ? a : 0) - (isDefined(b) ? b : 0);
            },
            "*": function(self, locals, a, b) {
                return a(self, locals) * b(self, locals);
            },
            "/": function(self, locals, a, b) {
                return a(self, locals) / b(self, locals);
            },
            "%": function(self, locals, a, b) {
                return a(self, locals) % b(self, locals);
            },
            "^": function(self, locals, a, b) {
                return a(self, locals) ^ b(self, locals);
            },
            "=": noop,
            "===": function(self, locals, a, b) {
                return a(self, locals) === b(self, locals);
            },
            "!==": function(self, locals, a, b) {
                return a(self, locals) !== b(self, locals);
            },
            "==": function(self, locals, a, b) {
                return a(self, locals) == b(self, locals);
            },
            "!=": function(self, locals, a, b) {
                return a(self, locals) != b(self, locals);
            },
            "<": function(self, locals, a, b) {
                return a(self, locals) < b(self, locals);
            },
            ">": function(self, locals, a, b) {
                return a(self, locals) > b(self, locals);
            },
            "<=": function(self, locals, a, b) {
                return a(self, locals) <= b(self, locals);
            },
            ">=": function(self, locals, a, b) {
                return a(self, locals) >= b(self, locals);
            },
            "&&": function(self, locals, a, b) {
                return a(self, locals) && b(self, locals);
            },
            "||": function(self, locals, a, b) {
                return a(self, locals) || b(self, locals);
            },
            "&": function(self, locals, a, b) {
                return a(self, locals) & b(self, locals);
            },
            "|": function(self, locals, a, b) {
                return b(self, locals)(self, locals, a(self, locals));
            },
            "!": function(self, locals, a) {
                return !a(self, locals);
            }
        };
        function ensureSafeMemberName(name, fullExpression) {
            if (name === "constructor") {
                throw $parseMinErr("isecfld", 'Referencing "constructor" field in Angular expressions is disallowed! Expression: {0}', fullExpression);
            }
            return name;
        }
        function ensureSafeObject(obj, fullExpression) {
            if (obj) {
                if (obj.constructor === obj) {
                    throw $parseMinErr("isecfn", "Referencing Function in Angular expressions is disallowed! Expression: {0}", fullExpression);
                } else if (obj.document && obj.location && obj.alert && obj.setInterval) {
                    throw $parseMinErr("isecwindow", "Referencing the Window in Angular expressions is disallowed! Expression: {0}", fullExpression);
                } else if (obj.children && (obj.nodeName || obj.prop && obj.attr && obj.find)) {
                    throw $parseMinErr("isecdom", "Referencing DOM nodes in Angular expressions is disallowed! Expression: {0}", fullExpression);
                }
            }
            return obj;
        }
        var ESCAPE = {
            n: "\n",
            f: "\f",
            r: "\r",
            t: "	",
            v: "",
            "'": "'",
            '"': '"'
        };
        function valueFn(value) {
            return function() {
                return value;
            };
        }
        var promiseWarning = function promiseWarningFn(fullExp) {
            if (!$parseOptions.logPromiseWarnings || promiseWarningCache.hasOwnProperty(fullExp)) return;
            promiseWarningCache[fullExp] = true;
            $log.warn("[$parse] Promise found in the expression `" + fullExp + "`. " + "Automatic unwrapping of promises in Angular expressions is deprecated.");
        };
        function noop() {}
        function isDefined(value) {
            return typeof value !== "undefined";
        }
        function toJsonReplacer(key, value) {
            var val = value;
            if (typeof key === "string" && key.charAt(0) === "$") {
                val = undefined;
            } else if (isWindow(value)) {
                val = "$WINDOW";
            } else if (value && document === value) {
                val = "$DOCUMENT";
            } else if (isScope(value)) {
                val = "$SCOPE";
            }
            return val;
        }
        function isWindow(obj) {
            return obj && obj.document && obj.location && obj.alert && obj.setInterval;
        }
        function isScope(obj) {
            return obj && obj.$evalAsync && obj.$watch;
        }
        function toJson(obj, pretty) {
            if (typeof obj === "undefined") return undefined;
            return JSON.stringify(obj, toJsonReplacer, pretty ? "  " : null);
        }
        var $parseMinErr = minErr("$parse");
        function minErr(module) {
            return function() {
                var code = arguments[0], prefix = "[" + (module ? module + ":" : "") + code + "] ", template = arguments[1], templateArgs = arguments, stringify = function(obj) {
                    if (typeof obj === "function") {
                        return obj.toString().replace(/ \{[\s\S]*$/, "");
                    } else if (typeof obj === "undefined") {
                        return "undefined";
                    } else if (typeof obj !== "string") {
                        return JSON.stringify(obj);
                    }
                    return obj;
                }, message, i;
                message = prefix + template.replace(/\{\d+\}/g, function(match) {
                    var index = +match.slice(1, -1), arg;
                    if (index + 2 < templateArgs.length) {
                        arg = templateArgs[index + 2];
                        if (typeof arg === "function") {
                            return arg.toString().replace(/ ?\{[\s\S]*$/, "");
                        } else if (typeof arg === "undefined") {
                            return "undefined";
                        } else if (typeof arg !== "string") {
                            return toJson(arg);
                        }
                        return arg;
                    }
                    return match;
                });
                message = message + "\nhttp://errors.angularjs.org/1.3.0-beta.8/" + (module ? module + "/" : "") + code;
                for (i = 2; i < arguments.length; i++) {
                    message = message + (i == 2 ? "?" : "&") + "p" + (i - 2) + "=" + encodeURIComponent(stringify(arguments[i]));
                }
                return new Error(message);
            };
        }
        var lowercase = function(string) {
            return isString(string) ? string.toLowerCase() : string;
        };
        function isString(value) {
            return typeof value === "string";
        }
        function toArray(obj) {
            var result = [], i = 0, len = obj.length;
            if (obj.length !== undefined) {
                while (i < len) {
                    result.push(obj[i]);
                    i += 1;
                }
            } else {
                for (i in obj) {
                    if (obj.hasOwnProperty(i)) {
                        result.push(obj[i]);
                    }
                }
            }
            return result;
        }
        function forEach(list, method, data) {
            var i = 0, len, result, extraArgs;
            if (arguments.length > 2) {
                extraArgs = toArray(arguments);
                extraArgs.splice(0, 2);
            }
            if (list && list.length) {
                len = list.length;
                while (i < len) {
                    result = method.apply(null, [ list[i], i, list ].concat(extraArgs));
                    if (result !== undefined) {
                        return result;
                    }
                    i += 1;
                }
            } else if (!(list instanceof Array)) {
                for (i in list) {
                    if (list.hasOwnProperty(i)) {
                        result = method.apply(null, [ list[i], i, list ].concat(extraArgs));
                        if (result !== undefined) {
                            return result;
                        }
                    }
                }
            }
            return list;
        }
        function setHashKey(obj, h) {
            if (h) {
                obj.$$hashKey = h;
            } else {
                delete obj.$$hashKey;
            }
        }
        function extend(dst) {
            var h = dst.$$hashKey;
            forEach(arguments, function(obj) {
                if (obj !== dst) {
                    forEach(obj, function(value, key) {
                        dst[key] = value;
                    });
                }
            });
            setHashKey(dst, h);
            return dst;
        }
        var Lexer = function(options) {
            this.options = options;
        };
        Lexer.prototype = {
            constructor: Lexer,
            lex: function(text) {
                this.text = text;
                this.index = 0;
                this.ch = undefined;
                this.lastCh = ":";
                this.tokens = [];
                var token;
                var json = [];
                while (this.index < this.text.length) {
                    this.ch = this.text.charAt(this.index);
                    if (this.is("\"'")) {
                        this.readString(this.ch);
                    } else if (this.isNumber(this.ch) || this.is(".") && this.isNumber(this.peek())) {
                        this.readNumber();
                    } else if (this.isIdent(this.ch)) {
                        this.readIdent();
                        if (this.was("{,") && json[0] === "{" && (token = this.tokens[this.tokens.length - 1])) {
                            token.json = token.text.indexOf(".") === -1;
                        }
                    } else if (this.is("(){}[].,;:?")) {
                        this.tokens.push({
                            index: this.index,
                            text: this.ch,
                            json: this.was(":[,") && this.is("{[") || this.is("}]:,")
                        });
                        if (this.is("{[")) json.unshift(this.ch);
                        if (this.is("}]")) json.shift();
                        this.index++;
                    } else if (this.isWhitespace(this.ch)) {
                        this.index++;
                        continue;
                    } else {
                        var ch2 = this.ch + this.peek();
                        var ch3 = ch2 + this.peek(2);
                        var fn = OPERATORS[this.ch];
                        var fn2 = OPERATORS[ch2];
                        var fn3 = OPERATORS[ch3];
                        if (fn3) {
                            this.tokens.push({
                                index: this.index,
                                text: ch3,
                                fn: fn3
                            });
                            this.index += 3;
                        } else if (fn2) {
                            this.tokens.push({
                                index: this.index,
                                text: ch2,
                                fn: fn2
                            });
                            this.index += 2;
                        } else if (fn) {
                            this.tokens.push({
                                index: this.index,
                                text: this.ch,
                                fn: fn,
                                json: this.was("[,:") && this.is("+-")
                            });
                            this.index += 1;
                        } else {
                            this.throwError("Unexpected next character ", this.index, this.index + 1);
                        }
                    }
                    this.lastCh = this.ch;
                }
                return this.tokens;
            },
            is: function(chars) {
                return chars.indexOf(this.ch) !== -1;
            },
            was: function(chars) {
                return chars.indexOf(this.lastCh) !== -1;
            },
            peek: function(i) {
                var num = i || 1;
                return this.index + num < this.text.length ? this.text.charAt(this.index + num) : false;
            },
            isNumber: function(ch) {
                return "0" <= ch && ch <= "9";
            },
            isWhitespace: function(ch) {
                return ch === " " || ch === "\r" || ch === "	" || ch === "\n" || ch === "" || ch === " ";
            },
            isIdent: function(ch) {
                return "a" <= ch && ch <= "z" || "A" <= ch && ch <= "Z" || "_" === ch || ch === "$";
            },
            isExpOperator: function(ch) {
                return ch === "-" || ch === "+" || this.isNumber(ch);
            },
            throwError: function(error, start, end) {
                end = end || this.index;
                var colStr = isDefined(start) ? "s " + start + "-" + this.index + " [" + this.text.substring(start, end) + "]" : " " + end;
                throw $parseMinErr("lexerr", "Lexer Error: {0} at column{1} in expression [{2}].", error, colStr, this.text);
            },
            readNumber: function() {
                var number = "";
                var start = this.index;
                while (this.index < this.text.length) {
                    var ch = lowercase(this.text.charAt(this.index));
                    if (ch == "." || this.isNumber(ch)) {
                        number += ch;
                    } else {
                        var peekCh = this.peek();
                        if (ch == "e" && this.isExpOperator(peekCh)) {
                            number += ch;
                        } else if (this.isExpOperator(ch) && peekCh && this.isNumber(peekCh) && number.charAt(number.length - 1) == "e") {
                            number += ch;
                        } else if (this.isExpOperator(ch) && (!peekCh || !this.isNumber(peekCh)) && number.charAt(number.length - 1) == "e") {
                            this.throwError("Invalid exponent");
                        } else {
                            break;
                        }
                    }
                    this.index++;
                }
                number = 1 * number;
                this.tokens.push({
                    index: start,
                    text: number,
                    json: true,
                    fn: function() {
                        return number;
                    }
                });
            },
            readIdent: function() {
                var parser = this;
                var ident = "";
                var start = this.index;
                var lastDot, peekIndex, methodName, ch;
                while (this.index < this.text.length) {
                    ch = this.text.charAt(this.index);
                    if (ch === "." || this.isIdent(ch) || this.isNumber(ch)) {
                        if (ch === ".") lastDot = this.index;
                        ident += ch;
                    } else {
                        break;
                    }
                    this.index++;
                }
                if (lastDot) {
                    peekIndex = this.index;
                    while (peekIndex < this.text.length) {
                        ch = this.text.charAt(peekIndex);
                        if (ch === "(") {
                            methodName = ident.substr(lastDot - start + 1);
                            ident = ident.substr(0, lastDot - start);
                            this.index = peekIndex;
                            break;
                        }
                        if (this.isWhitespace(ch)) {
                            peekIndex++;
                        } else {
                            break;
                        }
                    }
                }
                var token = {
                    index: start,
                    text: ident
                };
                if (OPERATORS.hasOwnProperty(ident)) {
                    token.fn = OPERATORS[ident];
                    token.json = OPERATORS[ident];
                } else {
                    var getter = getterFn(ident, this.options, this.text);
                    token.fn = extend(function(self, locals) {
                        return getter(self, locals);
                    }, {
                        assign: function(self, value) {
                            return setter(self, ident, value, parser.text, parser.options);
                        }
                    });
                }
                this.tokens.push(token);
                if (methodName) {
                    this.tokens.push({
                        index: lastDot,
                        text: ".",
                        json: false
                    });
                    this.tokens.push({
                        index: lastDot + 1,
                        text: methodName,
                        json: false
                    });
                }
            },
            readString: function(quote) {
                var start = this.index;
                this.index++;
                var string = "";
                var rawString = quote;
                var escape = false;
                while (this.index < this.text.length) {
                    var ch = this.text.charAt(this.index);
                    rawString += ch;
                    if (escape) {
                        if (ch === "u") {
                            var hex = this.text.substring(this.index + 1, this.index + 5);
                            if (!hex.match(/[\da-f]{4}/i)) this.throwError("Invalid unicode escape [\\u" + hex + "]");
                            this.index += 4;
                            string += String.fromCharCode(parseInt(hex, 16));
                        } else {
                            var rep = ESCAPE[ch];
                            if (rep) {
                                string += rep;
                            } else {
                                string += ch;
                            }
                        }
                        escape = false;
                    } else if (ch === "\\") {
                        escape = true;
                    } else if (ch === quote) {
                        this.index++;
                        this.tokens.push({
                            index: start,
                            text: rawString,
                            string: string,
                            json: true,
                            fn: function() {
                                return string;
                            }
                        });
                        return;
                    } else {
                        string += ch;
                    }
                    this.index++;
                }
                this.throwError("Unterminated quote", start);
            }
        };
        var Parser = function(lexer, $filter, options) {
            this.lexer = lexer;
            this.$filter = $filter;
            this.options = options;
        };
        Parser.ZERO = extend(function() {
            return 0;
        }, {
            constant: true
        });
        Parser.prototype = {
            constructor: Parser,
            parse: function(text, json) {
                this.text = text;
                this.json = json;
                this.tokens = this.lexer.lex(text);
                if (json) {
                    this.assignment = this.logicalOR;
                    this.functionCall = this.fieldAccess = this.objectIndex = this.filterChain = function() {
                        this.throwError("is not valid json", {
                            text: text,
                            index: 0
                        });
                    };
                }
                var value = json ? this.primary() : this.statements();
                if (this.tokens.length !== 0) {
                    this.throwError("is an unexpected token", this.tokens[0]);
                }
                value.literal = !!value.literal;
                value.constant = !!value.constant;
                return value;
            },
            primary: function() {
                var primary;
                if (this.expect("(")) {
                    primary = this.filterChain();
                    this.consume(")");
                } else if (this.expect("[")) {
                    primary = this.arrayDeclaration();
                } else if (this.expect("{")) {
                    primary = this.object();
                } else {
                    var token = this.expect();
                    primary = token.fn;
                    if (!primary) {
                        this.throwError("not a primary expression", token);
                    }
                    if (token.json) {
                        primary.constant = true;
                        primary.literal = true;
                    }
                }
                var next, context;
                while (next = this.expect("(", "[", ".")) {
                    if (next.text === "(") {
                        primary = this.functionCall(primary, context);
                        context = null;
                    } else if (next.text === "[") {
                        context = primary;
                        primary = this.objectIndex(primary);
                    } else if (next.text === ".") {
                        context = primary;
                        primary = this.fieldAccess(primary);
                    } else {
                        this.throwError("IMPOSSIBLE");
                    }
                }
                return primary;
            },
            throwError: function(msg, token) {
                throw $parseMinErr("syntax", "Syntax Error: Token '{0}' {1} at column {2} of the expression [{3}] starting at [{4}].", token.text, msg, token.index + 1, this.text, this.text.substring(token.index));
            },
            peekToken: function() {
                if (this.tokens.length === 0) throw $parseMinErr("ueoe", "Unexpected end of expression: {0}", this.text);
                return this.tokens[0];
            },
            peek: function(e1, e2, e3, e4) {
                if (this.tokens.length > 0) {
                    var token = this.tokens[0];
                    var t = token.text;
                    if (t === e1 || t === e2 || t === e3 || t === e4 || !e1 && !e2 && !e3 && !e4) {
                        return token;
                    }
                }
                return false;
            },
            expect: function(e1, e2, e3, e4) {
                var token = this.peek(e1, e2, e3, e4);
                if (token) {
                    if (this.json && !token.json) {
                        this.throwError("is not valid json", token);
                    }
                    this.tokens.shift();
                    return token;
                }
                return false;
            },
            consume: function(e1) {
                if (!this.expect(e1)) {
                    this.throwError("is unexpected, expecting [" + e1 + "]", this.peek());
                }
            },
            unaryFn: function(fn, right) {
                return extend(function(self, locals) {
                    return fn(self, locals, right);
                }, {
                    constant: right.constant
                });
            },
            ternaryFn: function(left, middle, right) {
                return extend(function(self, locals) {
                    return left(self, locals) ? middle(self, locals) : right(self, locals);
                }, {
                    constant: left.constant && middle.constant && right.constant
                });
            },
            binaryFn: function(left, fn, right) {
                return extend(function(self, locals) {
                    return fn(self, locals, left, right);
                }, {
                    constant: left.constant && right.constant
                });
            },
            statements: function() {
                var statements = [];
                while (true) {
                    if (this.tokens.length > 0 && !this.peek("}", ")", ";", "]")) statements.push(this.filterChain());
                    if (!this.expect(";")) {
                        return statements.length === 1 ? statements[0] : function(self, locals) {
                            var value;
                            for (var i = 0; i < statements.length; i++) {
                                var statement = statements[i];
                                if (statement) {
                                    value = statement(self, locals);
                                }
                            }
                            return value;
                        };
                    }
                }
            },
            filterChain: function() {
                var left = this.expression();
                var token;
                while (true) {
                    if (token = this.expect("|")) {
                        left = this.binaryFn(left, token.fn, this.filter());
                    } else {
                        return left;
                    }
                }
            },
            filter: function() {
                var token = this.expect();
                var fn = this.$filter(token.text);
                var argsFn = [];
                while (true) {
                    if (token = this.expect(":")) {
                        argsFn.push(this.expression());
                    } else {
                        var fnInvoke = function(self, locals, input) {
                            var args = [ input ];
                            for (var i = 0; i < argsFn.length; i++) {
                                args.push(argsFn[i](self, locals));
                            }
                            return fn.apply(self, args);
                        };
                        return function() {
                            return fnInvoke;
                        };
                    }
                }
            },
            expression: function() {
                return this.assignment();
            },
            assignment: function() {
                var left = this.ternary();
                var right;
                var token;
                if (token = this.expect("=")) {
                    if (!left.assign) {
                        this.throwError("implies assignment but [" + this.text.substring(0, token.index) + "] can not be assigned to", token);
                    }
                    right = this.ternary();
                    return function(scope, locals) {
                        return left.assign(scope, right(scope, locals), locals);
                    };
                }
                return left;
            },
            ternary: function() {
                var left = this.logicalOR();
                var middle;
                var token;
                if (token = this.expect("?")) {
                    middle = this.ternary();
                    if (token = this.expect(":")) {
                        return this.ternaryFn(left, middle, this.ternary());
                    } else {
                        this.throwError("expected :", token);
                    }
                } else {
                    return left;
                }
            },
            logicalOR: function() {
                var left = this.logicalAND();
                var token;
                while (true) {
                    if (token = this.expect("||")) {
                        left = this.binaryFn(left, token.fn, this.logicalAND());
                    } else {
                        return left;
                    }
                }
            },
            logicalAND: function() {
                var left = this.equality();
                var token;
                if (token = this.expect("&&")) {
                    left = this.binaryFn(left, token.fn, this.logicalAND());
                }
                return left;
            },
            equality: function() {
                var left = this.relational();
                var token;
                if (token = this.expect("==", "!=", "===", "!==")) {
                    left = this.binaryFn(left, token.fn, this.equality());
                }
                return left;
            },
            relational: function() {
                var left = this.additive();
                var token;
                if (token = this.expect("<", ">", "<=", ">=")) {
                    left = this.binaryFn(left, token.fn, this.relational());
                }
                return left;
            },
            additive: function() {
                var left = this.multiplicative();
                var token;
                while (token = this.expect("+", "-")) {
                    left = this.binaryFn(left, token.fn, this.multiplicative());
                }
                return left;
            },
            multiplicative: function() {
                var left = this.unary();
                var token;
                while (token = this.expect("*", "/", "%")) {
                    left = this.binaryFn(left, token.fn, this.unary());
                }
                return left;
            },
            unary: function() {
                var token;
                if (this.expect("+")) {
                    return this.primary();
                } else if (token = this.expect("-")) {
                    return this.binaryFn(Parser.ZERO, token.fn, this.unary());
                } else if (token = this.expect("!")) {
                    return this.unaryFn(token.fn, this.unary());
                } else {
                    return this.primary();
                }
            },
            fieldAccess: function(object) {
                var parser = this;
                var field = this.expect().text;
                var getter = getterFn(field, this.options, this.text);
                return extend(function(scope, locals, self) {
                    return getter(self || object(scope, locals));
                }, {
                    assign: function(scope, value, locals) {
                        return setter(object(scope, locals), field, value, parser.text, parser.options);
                    }
                });
            },
            objectIndex: function(obj) {
                var parser = this;
                var indexFn = this.expression();
                this.consume("]");
                return extend(function(self, locals) {
                    var o = obj(self, locals), i = indexFn(self, locals), v, p;
                    if (!o) return undefined;
                    v = ensureSafeObject(o[i], parser.text);
                    if (v && v.then && parser.options.unwrapPromises) {
                        p = v;
                        if (!("$$v" in v)) {
                            p.$$v = undefined;
                            p.then(function(val) {
                                p.$$v = val;
                            });
                        }
                        v = v.$$v;
                    }
                    return v;
                }, {
                    assign: function(self, value, locals) {
                        var key = indexFn(self, locals);
                        var safe = ensureSafeObject(obj(self, locals), parser.text);
                        return safe[key] = value;
                    }
                });
            },
            functionCall: function(fn, contextGetter) {
                var argsFn = [];
                if (this.peekToken().text !== ")") {
                    do {
                        argsFn.push(this.expression());
                    } while (this.expect(","));
                }
                this.consume(")");
                var parser = this;
                return function(scope, locals) {
                    var args = [];
                    var context = contextGetter ? contextGetter(scope, locals) : scope;
                    for (var i = 0; i < argsFn.length; i++) {
                        args.push(argsFn[i](scope, locals));
                    }
                    var fnPtr = fn(scope, locals, context) || noop;
                    ensureSafeObject(context, parser.text);
                    ensureSafeObject(fnPtr, parser.text);
                    var v = fnPtr.apply ? fnPtr.apply(context, args) : fnPtr(args[0], args[1], args[2], args[3], args[4]);
                    return ensureSafeObject(v, parser.text);
                };
            },
            arrayDeclaration: function() {
                var elementFns = [];
                var allConstant = true;
                if (this.peekToken().text !== "]") {
                    do {
                        if (this.peek("]")) {
                            break;
                        }
                        var elementFn = this.expression();
                        elementFns.push(elementFn);
                        if (!elementFn.constant) {
                            allConstant = false;
                        }
                    } while (this.expect(","));
                }
                this.consume("]");
                return extend(function(self, locals) {
                    var array = [];
                    for (var i = 0; i < elementFns.length; i++) {
                        array.push(elementFns[i](self, locals));
                    }
                    return array;
                }, {
                    literal: true,
                    constant: allConstant
                });
            },
            object: function() {
                var keyValues = [];
                var allConstant = true;
                if (this.peekToken().text !== "}") {
                    do {
                        if (this.peek("}")) {
                            break;
                        }
                        var token = this.expect(), key = token.string || token.text;
                        this.consume(":");
                        var value = this.expression();
                        keyValues.push({
                            key: key,
                            value: value
                        });
                        if (!value.constant) {
                            allConstant = false;
                        }
                    } while (this.expect(","));
                }
                this.consume("}");
                return extend(function(self, locals) {
                    var object = {};
                    for (var i = 0; i < keyValues.length; i++) {
                        var keyValue = keyValues[i];
                        object[keyValue.key] = keyValue.value(self, locals);
                    }
                    return object;
                }, {
                    literal: true,
                    constant: allConstant
                });
            }
        };
        var lexer = new Lexer({}), $filter = {}, parser = new Parser(lexer, $filter, {
            unwrapPromises: true
        });
        return parser.parse.bind(parser);
    }();
    parsers.rawEval = function(val) {
        try {
            val = "(function(){return " + val + ";})()";
            val = eval(val);
        } catch (e) {
            val = "###invalid###";
        }
        return val;
    };
    parsers.scopeEval = function(scope, src) {
        var fn = Function;
        var result = new fn("with(this) { return " + src + "}").apply(scope);
        if (result + "" === "NaN") {
            result = "";
        }
        return result;
    };
    patterns.command = function() {
        var commandMap;
        function CommandExecutor(commands, args) {
            this.commands = commands;
            this.args = args.splice(0);
        }
        CommandExecutor.counter = 0;
        CommandExecutor.prototype.execute = function(completeCallback) {
            var scope = this, promise;
            if (this.commands.length) {
                promise = this.next(scope.commands.shift());
                promise.then(function() {
                    scope.execute(completeCallback);
                });
            } else {
                completeCallback();
            }
        };
        CommandExecutor.prototype.next = function(command) {
            var deferred = async.defer(), commandComplete;
            deferred.__uid = CommandExecutor.counter += 1;
            if (typeof command === "function") {
                command = new command();
            } else {
                command = data.copy(command);
            }
            if (command.execute === undefined) {
                throw new Error('Command expects "execute" to be defined.');
            }
            if (typeof command.execute !== "function") {
                throw new Error('Command expects "execute" to be of type function.');
            }
            if ("complete" in command) {
                commandComplete = command.complete;
                command.complete = function() {
                    commandComplete.apply(command);
                    if ("destruct" in command) {
                        command.destruct();
                    }
                    deferred.resolve();
                };
            } else {
                command.complete = function() {
                    if ("destruct" in command) {
                        command.destruct();
                    }
                    deferred.resolve();
                };
            }
            if ("construct" in command) {
                command.construct.apply(command, this.args);
            }
            command.execute.apply(command, this.args);
            if (commandComplete === undefined) {
                command.complete();
            }
            return deferred.promise;
        };
        function CommandMap() {
            this._mappings = {};
            async.dispatcher(this);
        }
        CommandMap.prototype.map = function(event) {
            if (typeof event !== "string") {
                throw new Error("Event must of type string.");
            }
            if (!event.length) {
                throw new Error("Event string cannot be empty");
            }
            var scope = this;
            if (!this._mappings[event]) {
                this._mappings[event] = new CommandMapper();
                this._mappings[event].unsubscribe = this.on(event, function() {
                    var args, commandMapper, commandExecutor, promise;
                    args = Array.prototype.slice.call(arguments);
                    args.shift();
                    commandMapper = scope._mappings[event];
                    if (!commandMapper.commandExecutor) {
                        commandMapper.commandExecutor = new CommandExecutor(commandMapper.getCommands(), args);
                        commandMapper.commandExecutor.execute(function() {
                            delete commandMapper.commandExecutor;
                            promise = null;
                        });
                    }
                });
            }
            return this._mappings[event];
        };
        CommandMap.prototype.unmap = function(event, command) {
            if (this._mappings[event]) {
                this._mappings[event].fromCommand(command);
                if (this._mappings[event].isEmpty()) {
                    this._mappings[event].unsubscribe();
                    delete this._mappings[event];
                }
            }
        };
        CommandMap.prototype.umapAll = function() {
            this._mappings = {};
        };
        function CommandMapper() {
            this._commands = [];
            async.dispatcher(this);
        }
        CommandMapper.prototype.getCommands = function() {
            return this._commands.splice(0);
        };
        CommandMapper.prototype.isEmpty = function() {
            return this._commands.length === 0;
        };
        CommandMapper.prototype.hasCommand = function(command) {
            var len = this._commands.length;
            while (len--) {
                if (this._commands[len] === command) {
                    return true;
                }
            }
            return false;
        };
        CommandMapper.prototype.toCommand = function(command) {
            if (!this.hasCommand(command)) {
                this._commands.push(command);
            }
        };
        CommandMapper.prototype.fromCommand = function(command) {
            var len = this._commands.length;
            while (len--) {
                if (this._commands[len] === command) {
                    this._commands.splice(len, 1);
                    break;
                }
            }
        };
        return new CommandMap();
    }();
    patterns.Singleton = function() {};
    patterns.Singleton.instances = {};
    patterns.Singleton.get = function(classRef) {
        if (typeof classRef === "function") {
            if (!classRef.__instance__) {
                var args = Array.prototype.slice.call(arguments, 0);
                classRef.__instance__ = new (Function.prototype.bind.apply(classRef, args))();
            }
            return classRef.__instance__;
        }
    };
    patterns.Singleton.getById = function(name, classRef) {
        if (typeof classRef === "function") {
            if (!classRef.__instances__) {
                classRef.__instances__ = {};
            }
            if (!classRef.__instances__[name]) {
                var args = Array.prototype.slice.call(arguments, 0);
                classRef.__instances__[name] = new (Function.prototype.bind.apply(classRef, args))();
            }
            return classRef.__instances__[name];
        }
    };
    (function() {
        if (!Array.prototype.indexOf) {
            Array.prototype.indexOf = function(value) {
                var i = 0, len = this.length, item;
                while (i < len) {
                    if (value === this[i]) return i;
                    i += 1;
                }
                return -1;
            };
        }
    })();
    (function() {
        Array.prototype.isArray = true;
    })();
    (function() {
        if (!Date.prototype.toISOString) {
            (function() {
                function pad(number) {
                    if (number < 10) {
                        return "0" + number;
                    }
                    return number;
                }
                Date.prototype.toISOString = function() {
                    return this.getUTCFullYear() + "-" + pad(this.getUTCMonth() + 1) + "-" + pad(this.getUTCDate()) + "T" + pad(this.getUTCHours()) + ":" + pad(this.getUTCMinutes()) + ":" + pad(this.getUTCSeconds()) + "." + (this.getUTCMilliseconds() / 1e3).toFixed(3).slice(2, 5) + "Z";
                };
            })();
        }
    });
    (function() {
        if (!String.prototype.supplant) {
            String.prototype.supplant = function(o) {
                return this.replace(/{([^{}]*)}/g, function(a, b) {
                    var r = o[b];
                    return typeof r === "string" || typeof r === "number" ? r : a;
                });
            };
        }
    })();
    (function() {
        if (!String.prototype.trim) {
            return function(value) {
                return validators.isString(value) ? value.replace(/^\s\s*/, "").replace(/\s\s*$/, "") : value;
            };
        }
        return function(value) {
            return validators.isString(value) ? value.trim() : value;
        };
    })();
    (function() {
        if (!"console" in window) {
            window.console = {
                isOverride: true,
                log: function() {},
                warn: function() {},
                info: function() {},
                error: function() {}
            };
        }
    })();
    query.fn.bind = query.fn.on = function(event, handler) {
        this.each(function(index, el) {
            if (el.attachEvent) {
                el["e" + event + handler] = handler;
                el[event + handler] = function() {
                    el["e" + event + handler](window.event);
                };
                el.attachEvent("on" + event, el[event + handler]);
            } else {
                el.addEventListener(event, handler, false);
            }
            if (!el.eventHolder) {
                el.eventHolder = [];
            }
            el.eventHolder[el.eventHolder.length] = [ event, handler ];
        });
        return this;
    };
    query.fn.change = function(handler) {
        if (validators.isDefined(handler)) {
            this.on("change", handler);
        } else {
            this.trigger("change");
        }
        return this;
    };
    query.fn.click = function(handler) {
        if (validators.isDefined(handler)) {
            this.bind("click", handler);
        } else {
            this.trigger("click");
        }
        return this;
    };
    query.fn.trigger = function(eventName, data) {
        var event;
        if (document.createEvent) {
            event = document.createEvent("HTMLEvents");
            event.initEvent(eventName, true, true);
        } else {
            event = document.createEventObject();
            event.eventType = eventName;
        }
        event.eventName = eventName;
        event.data = data;
        this.each(function(index, el) {
            if (document.createEvent) {
                el.dispatchEvent(event);
            } else {
                el.fireEvent("on" + event.eventType, event);
            }
        });
        return this;
    };
    query.fn.unbind = query.fn.off = function(event, handler) {
        if (arguments.length === 1) {
            this.unbindAll(event);
        } else {
            this.each(function(index, el) {
                if (el.detachEvent) {
                    el.detachEvent("on" + event, el[event + handler]);
                    el[event + handler] = null;
                } else {
                    el.removeEventListener(event, handler, false);
                }
            });
        }
        return this;
    };
    query.fn.unbindAll = function(event) {
        var scope = this;
        this.each(function(index, el) {
            if (el.eventHolder) {
                var removed = 0, handler;
                for (var i = 0; i < el.eventHolder.length; i++) {
                    if (el.eventHolder[i][0] === event) {
                        handler = el.eventHolder[i][1];
                        scope.off(el, event, handler);
                        if (el.detachEvent) {
                            el.detachEvent("on" + event, el[event + handler]);
                            el[event + handler] = null;
                        } else {
                            el.removeEventListener(event, handler, false);
                        }
                        el.eventHolder.splice(i, 1);
                        removed += 1;
                        i -= 1;
                    }
                }
            }
        });
        return this;
    };
    query.fn.height = function() {
        return this.css("height");
    };
    query.fn.innerHeight = function() {
        return this.css("innerHeight");
    };
    query.fn.innerWidth = function() {
        return this.css("innerWidth");
    };
    query.fn.offset = function() {
        if (this.length) {
            return this[0].getBoundingClientRect();
        }
    };
    query.fn.outerHeight = function() {
        return this.css("outerHeight");
    };
    query.fn.outerWidth = function() {
        return this.css("outerWidth");
    };
    query.fn.width = function() {
        return this.css("width");
    };
    query.fn.removeAttr = function(prop) {
        this.each(function(index, el) {
            el.removeAttribute(prop);
        });
        return this;
    };
    query.fn.attr = function(prop, value) {
        if (arguments.length === 2) {
            if (typeof value === "function") {
                this.each(function(index, el) {
                    var result = value.apply(el, [ index, prop ]);
                    this.setAttribute(prop, result);
                });
            } else {
                this.each(function(index, el) {
                    el.setAttribute(prop, value);
                });
            }
            return this;
        }
        if (typeof prop === "object") {
            this.each(function(index, el) {
                for (var n in prop) {
                    if (prop.hasOwnProperty(n)) {
                        el.setAttribute(n, prop[n]);
                    }
                }
            });
            return this;
        }
        if (this.length) {
            return this[0].getAttribute(prop);
        }
    };
    query.fn.data = function(prop, value) {
        return this.attr("data-" + prop, value);
    };
    query.fn.addClass = function(className) {
        var scope = this;
        this.each(function(index, el) {
            if (!scope.hasClass(el, className)) {
                el.className += " " + className;
            }
        });
        return this;
    };
    query.fn.hasClass = function(className) {
        var el = this[0];
        if (el.classList) {
            return el.classList.contains(className);
        } else {
            return new RegExp("(^| )" + className + "( |$)", "gi").test(el.className);
        }
        return false;
    };
    query.fn.removeClass = function(className) {
        var scope = this;
        this.each(function(index, el) {
            if (validators.isDefined(className)) {
                var newClass = " " + el.className.replace(/[\t\r\n]/g, " ") + " ";
                if (scope.hasClass(el, className)) {
                    while (newClass.indexOf(" " + className + " ") >= 0) {
                        newClass = newClass.replace(" " + className + " ", " ");
                    }
                    el.className = newClass.replace(/^\s+|\s+$/g, "");
                }
            } else {
                el.className = "";
            }
        });
        return this;
    };
    query.fn.css = function(prop, value) {
        var el, returnValue;
        if (this.length) {
            el = this[0];
            if (arguments.length > 1) {
                this.each(function(index, el) {
                    el.style[prop] = value;
                });
            }
            if (prop instanceof Array) {
                var i = 0, len = prop.length;
                returnValue = {};
                if (el.currentStyle) {
                    while (i < len) {
                        returnValue[prop[i]] = el.currentStyle[prop[i]];
                        i += 1;
                    }
                } else if (window.getComputedStyle) {
                    while (i < len) {
                        returnValue[prop[i]] = document.defaultView.getComputedStyle(el, null).getPropertyValue(prop[i]);
                        i += 1;
                    }
                }
            } else {
                if (el.currentStyle) {
                    returnValue = el.currentStyle[prop];
                } else if (window.getComputedStyle) {
                    returnValue = document.defaultView.getComputedStyle(el, null).getPropertyValue(prop);
                }
            }
            return returnValue;
        }
        return null;
    };
    query.fn.prop = function(name, value) {
        if (this.length) {
            if (arguments.length > 2) {
                this[0][name] = value;
            } else {
                return this[0][name];
            }
        }
    };
    query.fn.is = function(name) {
        name = name.split(":").join("");
        return this.prop(name);
    };
    query.fn.after = function(elements) {
        var parentNode, i;
        if (typeof elements === "string") {
            elements = query(elements);
        }
        this.each(function(index, el) {
            parentNode = el.parentNode;
            i = elements.length;
            while (i--) {
                parentNode.insertBefore(elements[i].cloneNode(true), el.nextSibling);
            }
        });
    };
    query.fn.append = function(elements) {
        var i, len;
        if (typeof elements === "string") {
            elements = query(elements);
        }
        this.each(function(index, el) {
            i = 0;
            len = elements.length;
            while (i < len) {
                el.appendChild(elements[i].cloneNode(true));
                i += 1;
            }
        });
    };
    query.fn.before = function(content, elements) {};
    query.fn.empty = function() {
        this.each(function(index, el) {
            el.innerHTML = null;
        });
    };
    query.fn.html = function(val) {
        if (this.length) {
            var el = this[0];
            if (arguments.length > 0) {
                this.each(function(index, el) {
                    el.innerHTML = val;
                });
            }
            return el.innerHTML;
        }
    };
    query.fn.prepend = function(element) {
        if (typeof element === "string") {
            element = query(element);
        }
        if (element instanceof Array) {
            if (element.length) {
                element = element[0];
            }
        }
        if (element instanceof Element || element instanceof Node) {
            this.each(function(index, el) {
                if (el.childNodes.length) {
                    el.insertBefore(element, el.childNodes[0]);
                } else {
                    el.appendChild(element);
                }
            });
        }
    };
    query.fn.remove = function() {
        this.each(function(index, el) {
            if (el.parentElement) {
                el.parentElement.removeChild(el);
            }
        });
    };
    query.fn.text = function(val) {
        if (this.length) {
            var el = this[0];
            if (arguments.length > 0) {
                this.each(function(index, el) {
                    el.innerText = val;
                });
            }
            return el.innerText;
        }
    };
    query.fn.isChecked = function() {
        if (this.length) {
            return this[0].checked;
        }
        return false;
    };
    query.fn.isVisible = function() {
        var el;
        if (this.length) {
            el = this[0];
            if (el.parentNode.nodeType === 9) {
                return true;
            }
            if (el.offsetWidth === 0 || el.offsetHeight === 0) {
                return false;
            }
            if (el.style.display === "none") {
                return false;
            }
            if (el.style.visibility === "hidden") {
                return false;
            }
            if (el.style.opacity === 0 || el.style.opacity === "0") {
                return false;
            }
            return true;
        }
        return false;
    };
    query.fn.val = function(value) {
        var el, result, i, len, options;
        if (this.length) {
            el = this[0];
            if (arguments.length) {
                el.value = value;
            } else {
                if (el.nodeName === "SELECT" && el.multiple) {
                    result = [];
                    i = 0;
                    options = el.options;
                    len = options.length;
                    while (i < len) {
                        if (options) {
                            result.push(options[i].value || options[0].text);
                        }
                    }
                    return result.length === 0 ? null : result;
                }
                return el.value;
            }
        }
    };
    query.fn.children = function() {};
    query.fn.find = function(selector) {
        if (this.length) {
            return query(selector, this[0]);
        }
        return query();
    };
    query.fn.first = function(returnElement) {
        if (this.length) {
            if (returnElement) {
                return this[0];
            }
            return query(this[0]);
        }
        if (returnElement) {
            return null;
        }
        return query();
    };
    query.fn.get = function(index) {
        if (isDefined(index)) {
            if (Math.abs(index) < this.length) {
                if (index < 0) {
                    return this[this.length + index - 1];
                }
                return this[index];
            }
            return this;
        }
        return this.splice(0);
    };
    query.fn.last = function(returnElement) {
        if (this.length) {
            if (returnElement) {
                return this[this.length - 1];
            }
            return query(this[this.length - 1]);
        }
        if (returnElement) {
            return null;
        }
        return query();
    };
    query.fn.next = function() {};
    query.fn.not = function(selector) {
        if (this.length) {
            return query(":not(" + selector + ")", this[0]);
        }
        return query();
    };
    query.fn.parent = function(selector) {
        if (this.length) {
            var parent = this[0].parentNode;
            if (parent && parent.nodeType !== 11) {
                if (selector) {
                    return query(parent).find(selector);
                }
                return query(parent);
            }
        }
        return query();
    };
    query.fn.prev = function() {};
    timers.Timer = function(delay, repeat, limit) {
        var count, t, scope = this;
        function check() {
            count++;
            if (scope.limit && count >= scope.limit) {
                stop();
            }
        }
        function start(callback) {
            count = 0;
            t = setTimeout(function() {
                t = setInterval(function() {
                    check();
                    callback();
                }, scope.repeat);
                check();
                callback();
            }, scope.delay);
            check();
            callback();
        }
        function stop() {
            clearTimeout(t);
            clearInterval(t);
        }
        this.delay = delay || 300;
        this.repeat = repeat || 50;
        this.limit = limit || 0;
        this.start = start;
        this.stop = stop;
    };
    validators.isArray = function(val) {
        return val ? !!val.isArray : false;
    };
    validators.isArrayLike = function(obj) {
        if (obj == null || validators.isWindow(obj)) {
            return false;
        }
        var length = obj.length;
        if (obj.nodeType === 1 && length) {
            return true;
        }
        return validators.isString(obj) || validators.isArray(obj) || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;
    };
    validators.isBoolean = function(val) {
        return typeof val === "boolean";
    };
    validators.isDate = function(val) {
        return val instanceof Date;
    };
    validators.isUndefined = function(val) {
        return typeof val !== "undefined";
    };
    validators.isEmail = function(value) {
        var regExp = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9])+$/;
        return regExp.test(value + "");
    };
    validators.isEmpty = function(val) {
        if (_.isString(val)) {
            return val === "";
        }
        if (_.isArray(val)) {
            return val.length === 0;
        }
        if (_.isObject(val)) {
            for (var e in val) {
                return false;
            }
            return true;
        }
        return false;
    };
    validators.isFile = function(obj) {
        return toString.call(obj) === "[object File]";
    };
    validators.isFunction = function(val) {
        return typeof val === "function";
    };
    validators.isInt = function(val) {
        return String(val).search(/^\s*(\-)?\d+\s*$/) !== -1;
    };
    validators.isJson = function(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    };
    validators.isNumber = function(val) {
        return typeof val === "number";
    };
    validators.isObject = function(val) {
        return typeof val === "object";
    };
    validators.isRegExp = function(value) {
        return formatters.toString.call(value) === "[object RegExp]";
    };
    validators.isRequired = function(value, message) {
        if (typeof value === "undefined") {
            throw new Error(message || 'The property "' + value + '" is required');
        }
    };
    validators.isString = function isString(val) {
        return typeof val === "string";
    };
    validators.isTrue = function() {
        return {
            operators: [ "eq", "neq", "~eq", "~neq", "gt", "lt", "gte", "lte" ],
            test: function(valA, operator, valB) {
                if (!isNaN(valA) && !isNaN(valB)) {
                    valA = Number(valA);
                    valB = Number(valB);
                } else {
                    valA = valA === undefined ? "" : valA;
                    valB = valB === undefined ? "" : valB;
                }
                switch (operator) {
                  case "eq":
                    return valA + "" === valB + "";

                  case "neq":
                    return valA + "" !== valB + "";

                  case "~eq":
                    return (valA + "").toLowerCase() === (valB + "").toLowerCase();

                  case "~neq":
                    return (valA + "").toLowerCase() !== (valB + "").toLowerCase();

                  case "gt":
                    return valA > valB;

                  case "lt":
                    return valA < valB;

                  case "gte":
                    return valA >= valB;

                  case "lte":
                    return valA <= valB;
                }
            }
        };
    };
    validators.isUndefined = function(val) {
        return typeof val === "undefined";
    };
    validators.isWindow = function(obj) {
        return obj && obj.document && obj.location && obj.alert && obj.setInterval;
    };
    (function() {
        function insert(parentNode, newNode, position) {
            if (position === 0 || parentNode.childElementCount === 0) {
                parentNode.prependChild(newNode);
            } else if (parentNode.childElementCount === position) {
                parentNode.appendChild(newNode);
            } else {
                var referenceNode = parentNode.children[position - 1];
                insertAfter(newNode, referenceNode);
            }
        }
        function insertBefore(newNode, referenceNode) {
            referenceNode.parentNode.insertBefore(newNode, referenceNode);
        }
        function insertAfter(newNode, referenceNode) {
            referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
        }
        function replace(newNode, referenceNode) {
            referenceNode.parentNode.replaceChild(newNode, referenceNode);
        }
        function remove(node) {
            node.parentNode.removeChild(node);
        }
        xml.XMLDocument = {
            insert: insert,
            insertBefore: insertBefore,
            insertAfter: insertAfter,
            remove: remove,
            replace: replace
        };
    })();
    exports["aggregators"] = aggregators;
    exports["ajax"] = ajax;
    exports["async"] = async;
    exports["crypt"] = crypt;
    exports["browser"] = browser;
    exports["data"] = data;
    exports["display"] = display;
    exports["formatters"] = formatters;
    exports["geom"] = geom;
    exports["parsers"] = parsers;
    exports["patterns"] = patterns;
    exports["query"] = query;
    exports["timers"] = timers;
    exports["validators"] = validators;
    exports["xml"] = xml;
    exports["debounce"] = debounce;
    exports["forEach"] = forEach;
    exports["getName"] = getName;
    exports["throttle"] = throttle;
})({}, function() {
    return this;
}());