/*
* Utils v.0.1.0
* WebUX. MIT 2014
*/
(function(exports, global) {
    global["utils"] = exports;
    var cors = function cors() {
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
    function dispatcher(target, scope, map) {
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
    }
    var promise = function promise(undef) {
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
    var cookie = function cookie() {
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
    var localStorage = function localStorage() {
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
        dispatcher(api);
        return api;
    }();
    var md5 = function() {
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
    var getFunctionName = function getFunctionName(fn) {
        var f = typeof fn === "function";
        var s = f && (fn.name && [ "", fn.name ] || fn.toString().match(/function ([^\(]+)/));
        return !f && "not a function" || (s && s[1] || "anonymous");
    };
    var Singleton = function Singleton() {};
    Singleton.instances = {};
    Singleton.get = function(classRef) {
        if (typeof classRef === "function") {
            if (!classRef.__instance__) {
                var args = Array.prototype.slice.call(arguments, 0);
                classRef.__instance__ = new (Function.prototype.bind.apply(classRef, args))();
            }
            return classRef.__instance__;
        }
    };
    Singleton.getById = function(name, classRef) {
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
    var Timer = function(delay, repeat, limit) {
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
    Array.prototype.isArray = true;
    var isArray = function isArray(val) {
        return val ? !!val.isArray : false;
    };
    var isBoolean = function isBoolean(val) {
        return typeof val === "boolean";
    };
    var isDate = function(val) {
        return val instanceof Date;
    };
    var isEmpty = function isEmpty(val) {
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
    var isFunction = function(val) {
        return typeof val === "function";
    };
    var isJson = function isJson(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    };
    var isNumber = function isNumber(val) {
        return typeof val === "number";
    };
    var isObject = function(val) {
        return typeof val === "object";
    };
    var isString = function isString(val) {
        return typeof val === "string";
    };
    var isUndefined = function isUndefined(val) {
        return typeof val === "undefined";
    };
    exports["cors"] = cors;
    exports["dispatcher"] = dispatcher;
    exports["promise"] = promise;
    exports["cookie"] = cookie;
    exports["localStorage"] = localStorage;
    exports["md5"] = md5;
    exports["getFunctionName"] = getFunctionName;
    exports["Singleton"] = Singleton;
    exports["Timer"] = Timer;
    exports["isArray"] = isArray;
    exports["isBoolean"] = isBoolean;
    exports["isDate"] = isDate;
    exports["isEmpty"] = isEmpty;
    exports["isFunction"] = isFunction;
    exports["isJson"] = isJson;
    exports["isNumber"] = isNumber;
    exports["isObject"] = isObject;
    exports["isString"] = isString;
    exports["isUndefined"] = isUndefined;
})({}, function() {
    return this;
}());