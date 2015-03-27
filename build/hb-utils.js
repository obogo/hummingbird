/*
* Hummingbird v.0.5.45
* Obogo - MIT 2015
* https://github.com/obogo/hummingbird/
*/
(function(exports, global) {
    global["hb"] = exports;
    var $$ = exports.$$ || function(name) {
        if (!$$[name]) {
            $$[name] = {};
        }
        return $$[name];
    };
    var cache = $$("c");
    var internals = $$("i");
    var pending = $$("p");
    exports.$$ = $$;
    var toArray = function(args) {
        return Array.prototype.slice.call(args);
    };
    var _ = function(name) {
        var args = toArray(arguments);
        var val = args[1];
        if (typeof val === "function") {
            this.c[name] = val();
        } else {
            cache[name] = args[2];
            cache[name].$inject = val;
            cache[name].$internal = this.i;
        }
    };
    var define = function() {
        _.apply({
            i: false,
            c: exports
        }, toArray(arguments));
    };
    var internal = function() {
        _.apply({
            i: true,
            c: internals
        }, toArray(arguments));
    };
    var resolve = function(name, fn) {
        pending[name] = true;
        var injections = fn.$inject;
        var args = [];
        var injectionName;
        for (var i in injections) {
            if (injections.hasOwnProperty(i)) {
                injectionName = injections[i];
                if (cache[injectionName]) {
                    if (pending.hasOwnProperty(injectionName)) {
                        throw new Error('Cyclical reference: "' + name + '" referencing "' + injectionName + '"');
                    }
                    resolve(injectionName, cache[injectionName]);
                    delete cache[injectionName];
                }
            }
        }
        if (!exports[name] && !internals[name]) {
            for (var n in injections) {
                injectionName = injections[n];
                args.push(exports[injectionName] || internals[injectionName]);
            }
            if (fn.$internal) {
                internals[name] = fn.apply(null, args) || name;
            } else {
                exports[name] = fn.apply(null, args) || name;
            }
        }
        Object.defineProperty(exports, "$$", {
            enumerable: false,
            writable: false
        });
        delete pending[name];
    };
    //! src/utils/formatters/removeHTMLComments.js
    define("removeHTMLComments", function() {
        var removeHTMLComments = function(htmlStr) {
            htmlStr = htmlStr + "";
            return htmlStr.replace(/<!--[\s\S]*?-->/g, "");
        };
        return removeHTMLComments;
    });
    //! src/utils/ajax/http-interceptor.js
    internal("http.interceptor", [ "http", "parseRoute", "functionArgs" ], function(http, parseRoute, functionArgs) {
        var registry = [], result;
        function matchInterceptor(options) {
            var i, len = registry.length, interceptor, result, values, method, interceptorUrl;
            function onMatch(match) {
                method = match.trim();
                return "";
            }
            for (i = 0; i < len; i += 1) {
                interceptor = registry[i];
                if (interceptor.type === "string") {
                    method = null;
                    interceptorUrl = interceptor.matcher.replace(/^\w+\s+/, onMatch);
                    if (method && options.method.toLowerCase() !== method.toLowerCase()) {
                        result = undefined;
                    } else {
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
            if (args.indexOf("next") === -1) {
                interceptor[method](req, res);
                next();
            } else {
                interceptor[method](req, res, next);
            }
        }
        function addIntercept(matcher, preCallHandler, postCallHandler) {
            registry.push({
                matcher: matcher,
                type: typeof matcher,
                pre: preCallHandler,
                post: postCallHandler
            });
        }
        function removeIntercept(matcher) {
            var i, len = registry.length;
            for (i = 0; i < len; i += 1) {
                if (registry[i].matcher === matcher) {
                    registry.splice(i, 1);
                    i -= 1;
                    len -= 1;
                }
            }
        }
        function intercept(options, Request) {
            var interceptor = matchInterceptor(options), response, sent = false, res = {}, responseAPI = {
                status: function(value) {
                    res.status = value;
                },
                send: function(data) {
                    res.data = data;
                    preNext();
                }
            };
            function preNext() {
                if (!sent) {
                    sent = true;
                    if (res.data === undefined) {
                        response = new Request(options);
                        if (interceptor.post) {
                            response.xhr.onloadInterceptor = function(httpNext, result) {
                                for (var i in result) {
                                    if (result.hasOwnProperty(i) && res[i] === undefined) {
                                        res[i] = result[i];
                                    }
                                }
                                execInterceptorMethod(interceptor, "post", options, res, res.data ? postNext : httpNext);
                            };
                        }
                    } else if (interceptor.post) {
                        execInterceptorMethod(interceptor, "post", options, res, postNext);
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
                execInterceptorMethod(interceptor, "pre", options, responseAPI, preNext);
                return true;
            }
            return false;
        }
        http.intercept = intercept;
        return {
            add: addIntercept,
            remove: removeIntercept
        };
    });
    //! src/utils/parsers/parseRoute.js
    define("parseRoute", [ "each" ], function(each) {
        function keyValues(key, index, list, result, parts) {
            if (key[0] === ":") {
                result[key.replace(":", "")] = parts[index];
            }
        }
        function urlKeyValues(str, result) {
            var parts = str.split("=");
            result[parts[0]] = parts[1];
        }
        function getPathname(url, dropQueryParams) {
            if (dropQueryParams) {
                url = url.split("?").shift();
            }
            url = url.replace(/^\w+:\/\//, "");
            url = url.replace(/^\w+:\d+\//, "/");
            url = url.replace(/^\w+\.\w+\//, "/");
            return url;
        }
        function extractParams(patternUrl, url, combined) {
            url = getPathname(url);
            var parts = url.split("?"), searchParams = parts[1], params = {}, queryParams = {};
            if (patternUrl[0] === "/" && parts[0][0] !== "/") {
                parts[0] = "/" + parts[0];
            }
            parts = parts[0].split("/");
            each.call({
                all: true
            }, patternUrl.split("/"), keyValues, params, parts);
            if (searchParams) {
                each(searchParams.split("&"), urlKeyValues, queryParams);
            }
            return combined ? combine({}, [ params, queryParams ]) : {
                params: params,
                query: queryParams
            };
        }
        function combine(target, objects) {
            var i, j, len = objects.length, object;
            for (i = 0; i < len; i += 1) {
                object = objects[i];
                for (j in object) {
                    if (object.hasOwnProperty(j)) {
                        target[j] = object[j];
                    }
                }
            }
            return target;
        }
        function match(patternUrl, url) {
            var patternParams = patternUrl.indexOf("?") !== -1 ? patternUrl.split("?").pop().split("&") : [];
            patternUrl.replace(/:(\w+)/g, function(match, g) {
                patternParams.push(g);
                return match;
            });
            var values = extractParams(patternUrl.split("?").shift(), url, true);
            var hasParams = !!patternParams.length;
            if (hasParams) {
                each(patternParams, function(value) {
                    if (value === "") {} else if (!values.hasOwnProperty(value) || values[value] === undefined) {
                        hasParams = false;
                    }
                });
                if (!hasParams) {
                    return null;
                }
            }
            var matchUrl = patternUrl.split("?").shift().replace(/\/:(\w+)/g, function(match, g1) {
                return "/" + values[g1];
            });
            var endOfPathName = getPathname(url, true);
            return endOfPathName === matchUrl;
        }
        return {
            extractParams: extractParams,
            match: match
        };
    });
    //! src/utils/array/each.js
    define("each", function() {
        function applyMethod(scope, method, item, index, list, extraArgs, all) {
            var args = all ? [ item, index, list ] : [ item ];
            return method.apply(scope, args.concat(extraArgs));
        }
        var each = function(list, method) {
            var i = 0, len, result, extraArgs;
            if (arguments.length > 2) {
                extraArgs = Array.prototype.slice.apply(arguments);
                extraArgs.splice(0, 2);
            }
            if (list && list.length && list.hasOwnProperty(0)) {
                len = list.length;
                while (i < len) {
                    result = applyMethod(this.scope, method, list[i], i, list, extraArgs, this.all);
                    if (result !== undefined) {
                        return result;
                    }
                    i += 1;
                }
            } else if (!(list instanceof Array) && list.length === undefined) {
                for (i in list) {
                    if (list.hasOwnProperty(i) && (!this.omit || !this.omit[i])) {
                        result = applyMethod(this.scope, method, list[i], i, list, extraArgs, this.all);
                        if (result !== undefined) {
                            return result;
                        }
                    }
                }
            }
            return list;
        };
        return each;
    });
    //! src/utils/parsers/functionArgs.js
    define("functionArgs", function() {
        return function(fn) {
            var str = (fn || "") + "";
            return str.match(/\(.*\)/)[0].match(/([\$\w])+/gm);
        };
    });
    //! src/utils/ajax/http-jsonp.js
    internal("http.jsonp", [ "http" ], function(http) {
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
    //! src/utils/array/aggregate.js
    define("aggregate", function() {
        var aggregate = function(array, formatter) {
            var i = 0, len = array.length, returnVal = [], hash = {};
            while (i < len) {
                formatter(hash, array[i]);
                i += 1;
            }
            for (i in hash) {
                if (hash.hasOwnProperty(i)) {
                    returnVal.push(hash[i]);
                }
            }
            return returnVal;
        };
        aggregate.minute = function(prop) {
            var key;
            this.format = function(hash, data) {
                key = data[prop].getMinutes();
                hash[key] = hash[key] || {
                    date: data[prop].getTime(),
                    value: 0
                };
                hash[key].value += 1;
            };
        };
        aggregate.hour = function(prop) {
            var key;
            return function(hash, data) {
                key = data[prop].getHours();
                hash[key] = hash[key] || {
                    date: data[prop].getTime(),
                    value: 0
                };
                hash[key].value += 1;
            };
        };
        return aggregate;
    });
    //! src/utils/array/indexOfMatch.js
    define("indexOfMatch", [ "isMatch" ], function(isMatch) {
        function indexOfMatch(ary, filterObj) {
            for (var i = 0, len = ary.length; i < len; i += 1) {
                if (isMatch(ary[i], filterObj)) {
                    return i;
                }
            }
            return -1;
        }
        return indexOfMatch;
    });
    //! src/utils/validators/isMatch.js
    define("isMatch", [ "isRegExp" ], function(isRegExp) {
        var primitive = [ "string", "number", "boolean" ];
        function isMatch(item, filterObj) {
            var itemType;
            if (item === filterObj) {
                return true;
            } else if (typeof filterObj === "object") {
                itemType = typeof item;
                if (primitive.indexOf(itemType) !== -1 && isRegExp(filterObj) && !filterObj.test(item + "")) {
                    return false;
                }
                for (var j in filterObj) {
                    if (filterObj.hasOwnProperty(j)) {
                        if (!isMatch(item[j], filterObj[j])) {
                            return false;
                        }
                    }
                }
                return true;
            }
            return false;
        }
        return isMatch;
    });
    //! src/utils/validators/isRegExp.js
    define("isRegExp", function() {
        var isRegExp = function(value) {
            return Object.prototype.toString.call(value) === "[object RegExp]";
        };
        return isRegExp;
    });
    //! src/utils/array/matchAll.js
    define("matchAll", [ "matchIndexOf" ], function(matchIndexOf) {
        function matchAll(ary, filterObj) {
            var result = [], args = Array.prototype.slice.apply(arguments);
            args.shift();
            for (var i = 0, len = ary.length; i < len; i += 1) {
                if (matchIndexOf(args, ary[i]) !== -1) {
                    result.push(ary[i]);
                }
            }
            return result;
        }
        return matchAll;
    });
    //! src/utils/array/matchIndexOf.js
    define("matchIndexOf", [ "isMatch" ], function(isMatch) {
        function matchesAny(list, item) {
            for (var i = 0, len = list.length; i < len; i += 1) {
                if (isMatch(item, list[i])) {
                    return i;
                }
            }
            return -1;
        }
        return matchesAny;
    });
    //! src/utils/array/matchAllOthers.js
    define("matchAllOthers", [ "matchIndexOf" ], function(matchIndexOf) {
        function matchAllOthers(ary, filterObj) {
            var result = [], args = Array.prototype.slice.apply(arguments);
            args.shift();
            for (var i = 0, len = ary.length; i < len; i += 1) {
                if (matchIndexOf(args, ary[i]) === -1) {
                    result.push(ary[i]);
                }
            }
            return result;
        }
        return matchAllOthers;
    });
    //! src/utils/array/selection.js
    define("selection", function() {
        var selection = function(list, target) {
            var selectedItem, selectedIndex = -1;
            function select(item, index) {
                var previous;
                if (selectedItem !== item || selectedIndex !== index) {
                    previous = selectedItem;
                    selectedItem = item;
                    selectedIndex = index;
                    if (target.dispatch) {
                        target.dispatch(target.constructor.name + "::selectionChange", selectedItem, previous);
                    }
                }
            }
            function getSelectedItem() {
                return selectedItem;
            }
            function setSelectedItem(item) {
                var index = list.indexOf(item);
                if (index !== -1) {
                    select(item, index);
                }
            }
            function getSelectedIndex() {
                return selectedIndex;
            }
            function setSelectedIndex(index) {
                if (list[index]) {
                    select(list[index], index);
                }
            }
            target = target || {};
            target.getSelectedItem = getSelectedItem;
            target.setSelectedItem = setSelectedItem;
            target.getSelectedIndex = getSelectedIndex;
            target.setSelectedIndex = setSelectedIndex;
            return target;
        };
        return selection;
    });
    //! src/utils/array/sort.js
    define("sort", function() {
        function partition(array, left, right, fn) {
            var cmp = array[right - 1], minEnd = left, maxEnd, dir = 0;
            for (maxEnd = left; maxEnd < right - 1; maxEnd += 1) {
                dir = fn(array[maxEnd], cmp);
                if (dir < 0) {
                    if (maxEnd !== minEnd) {
                        swap(array, maxEnd, minEnd);
                    }
                    minEnd += 1;
                }
            }
            if (fn(array[minEnd], cmp)) {
                swap(array, minEnd, right - 1);
            }
            return minEnd;
        }
        function swap(array, i, j) {
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
            return array;
        }
        function quickSort(array, left, right, fn) {
            if (left < right) {
                var p = partition(array, left, right, fn);
                quickSort(array, left, p, fn);
                quickSort(array, p + 1, right, fn);
            }
            return array;
        }
        return function(array, fn) {
            var result = quickSort(array, 0, array.length, fn);
            return result;
        };
    });
    //! src/utils/array/sortOn.js
    define("sortOn", [ "sort" ], function(sort) {
        var sortOn = function(array, property, desc) {
            if (desc) {
                desc = 1;
            } else {
                desc = 0;
            }
            var sortfunc = function(a, b) {
                return desc ? b[property] > a[property] ? 1 : a[property] > b[property] ? -1 : 0 : b[property] < a[property] ? 1 : a[property] < b[property] ? -1 : 0;
            };
            return sort(array, sortfunc);
        };
        return sortOn;
    });
    //! src/utils/async/debounce.js
    define("debounce", function(debounce) {
        var debounce = function(func, wait, scope) {
            var timeout;
            return function() {
                var context = scope || this, args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    timeout = null;
                    func.apply(context, args);
                }, wait);
            };
        };
        return debounce;
    });
    //! src/utils/async/defer.js
    define("defer", function() {
        var defer = function(undef) {
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
                                    var returnVal = isFunc(fulfilled) ? fulfilled(value) : defer.onlyFuncs ? value : fulfilled;
                                    if (returnVal === undefined) {
                                        returnVal = value;
                                    }
                                    d.resolve(returnVal);
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
        return defer;
    });
    //! src/utils/async/dispatcher.js
    define("dispatcher", function() {
        var dispatcher = function(target, scope, map) {
            target = target || {};
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
                if (event) {
                    return listeners[event] || [];
                }
                return listeners;
            }
            function removeAllListeners() {
                listeners = {};
            }
            function fire(callback, args) {
                return callback && callback.apply(target, args);
            }
            function dispatch(event) {
                if (listeners[event]) {
                    var list = listeners[event].concat(), len = list.length;
                    for (var i = 0; i < len; i += 1) {
                        fire(list[i], arguments);
                    }
                }
                if (listeners.all && event !== "all") {
                    dispatch("all");
                }
            }
            if (scope && map) {
                target.on = scope[map.on] && scope[map.on].bind(scope);
                target.off = scope[map.off] && scope[map.off].bind(scope);
                target.once = scope[map.once] && scope[map.once].bind(scope);
                target.dispatch = target.fire = scope[map.dispatch].bind(scope);
            } else {
                target.on = on;
                target.off = off;
                target.once = once;
                target.dispatch = target.fire = dispatch;
            }
            target.getListeners = getListeners;
            target.removeAllListeners = removeAllListeners;
            return target;
        };
        return dispatcher;
    });
    //! src/utils/async/throttle.js
    define("throttle", function() {
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
        return throttle;
    });
    //! src/utils/async/waterfall.js
    define("waterfall", [ "toArray" ], function(toArray) {
        var waterfall = function(args, callbacks, resultHandler) {
            function callback() {
                if (callbacks.length) {
                    var cb = callbacks.shift();
                    cb.apply(null, toArray(arguments).concat(callback));
                } else {
                    var args = toArray(arguments);
                    args.unshift(null);
                    if (resultHandler) {
                        resultHandler.apply(null, args);
                    }
                }
            }
            args = args || [];
            callback.apply(null, args.concat(callback));
        };
        return waterfall;
    });
    //! src/utils/formatters/toArray.js
    define("toArray", [ "isArguments", "isArray", "isUndefined" ], function(isArguments, isArray, isUndefined) {
        var toArray = function(value) {
            if (isArguments(value)) {
                return Array.prototype.slice.call(value, 0) || [];
            }
            try {
                if (isArray(value)) {
                    return value;
                }
                if (!isUndefined(value)) {
                    return [].concat(value);
                }
            } catch (e) {}
            return [];
        };
        return toArray;
    });
    //! src/utils/validators/isArguments.js
    define("isArguments", [ "toString" ], function(toString) {
        var isArguments = function(value) {
            var str = String(value);
            var isArguments = str === "[object Arguments]";
            if (!isArguments) {
                isArguments = str !== "[object Array]" && value !== null && typeof value === "object" && typeof value.length === "number" && value.length >= 0 && (!value.callee || toString.call(value.callee) === "[object Function]");
            }
            return isArguments;
        };
        return isArguments;
    });
    //! src/utils/validators/isArray.js
    define("isArray", function() {
        Array.prototype.__isArray = true;
        Object.defineProperty(Array.prototype, "__isArray", {
            enumerable: false,
            writable: true
        });
        var isArray = function(val) {
            return val ? !!val.__isArray : false;
        };
        return isArray;
    });
    //! src/utils/validators/isUndefined.js
    define("isUndefined", function() {
        var isUndefined = function(val) {
            return typeof val === "undefined";
        };
        return isUndefined;
    });
    //! src/utils/browser/addFileToHead.js
    define("addFileToHead", function() {
        return function(filename) {
            var headEl = document.getElementsByTagName("head")[0];
            var attachEl;
            if (filename.match(/.*?\.js$/gim)) {
                attachEl = document.createElement("script");
                attachEl.setAttribute("type", "text/javascript");
                attachEl.setAttribute("src", filename);
            } else if (filename.match(/.*?\.css$/gim)) {
                attachEl = document.createElement("link");
                attachEl.setAttribute("rel", "stylesheet");
                attachEl.setAttribute("type", "text/css");
                attachEl.setAttribute("href", filename);
            }
            if (headEl) {
                headEl.appendChild(attachEl);
            }
        };
    });
    //! src/utils/browser/browserState.js
    define("browserState", [ "dispatcher" ], function(dispatcher) {
        var scope = dispatcher({});
        var notIE = document.documentMode === undefined;
        var isChromium = window.chrome;
        if (notIE && !isChromium) {
            window.addEventListener("focusin", function() {
                setTimeout(function() {
                    scope.dispatch("changed", "active");
                }, 300);
            });
            window.addEventListener("focusout", function() {
                scope.dispatch("changed", "inactive");
            });
        } else {
            if (window.addEventListener) {
                window.addEventListener("focus", function(event) {
                    setTimeout(function() {
                        scope.dispatch("changed", "active");
                    }, 300);
                }, false);
                window.addEventListener("blur", function(event) {
                    scope.dispatch("changed", "inactive");
                }, false);
            } else {
                window.attachEvent("focus", function(event) {
                    setTimeout(function() {
                        scope.dispatch("changed", "active");
                    }, 300);
                });
                window.attachEvent("blur", function(event) {
                    scope.dispatch("changed", "inactive");
                });
            }
        }
        return scope;
    });
    //! src/utils/browser/cookie.js
    define("cookie", function() {
        var cookie = function() {
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
        return cookie;
    });
    //! src/utils/browser/loader.js
    define("loader", [ "toArray" ], function(toArray) {
        return function(doc) {
            var env, head, pending = {}, pollCount = 0, queue = {
                css: [],
                js: []
            }, styleSheets = doc.styleSheets;
            function createNode(name, attrs) {
                var node = doc.createElement(name), attr;
                for (attr in attrs) {
                    if (attrs.hasOwnProperty(attr)) {
                        node.setAttribute(attr, attrs[attr]);
                    }
                }
                return node;
            }
            function finish(type) {
                var p = pending[type], callback, urls;
                if (p) {
                    callback = p.callback;
                    urls = p.urls;
                    urls.shift();
                    pollCount = 0;
                    if (!urls.length) {
                        callback && callback.call(p.context, p.obj);
                        pending[type] = null;
                        queue[type].length && load(type);
                    }
                }
            }
            function getEnv() {
                var ua = navigator.userAgent;
                env = {
                    async: doc.createElement("script").async === true
                };
                (env.webkit = /AppleWebKit\//.test(ua)) || (env.ie = /MSIE|Trident/.test(ua)) || (env.opera = /Opera/.test(ua)) || (env.gecko = /Gecko\//.test(ua)) || (env.unknown = true);
            }
            function load(type, urls, callback, obj, context) {
                var _finish = function() {
                    finish(type);
                }, isCSS = type === "css", nodes = [], i, len, node, p, pendingUrls, url;
                env || getEnv();
                if (urls) {
                    urls = typeof urls === "string" ? [ urls ] : urls.concat();
                    if (isCSS || env.async || env.gecko || env.opera) {
                        queue[type].push({
                            urls: urls,
                            callback: callback,
                            obj: obj,
                            context: context
                        });
                    } else {
                        for (i = 0, len = urls.length; i < len; ++i) {
                            queue[type].push({
                                urls: [ urls[i] ],
                                callback: i === len - 1 ? callback : null,
                                obj: obj,
                                context: context
                            });
                        }
                    }
                }
                if (pending[type] || !(p = pending[type] = queue[type].shift())) {
                    return;
                }
                head || (head = doc.head || doc.getElementsByTagName("head")[0]);
                pendingUrls = p.urls.concat();
                for (i = 0, len = pendingUrls.length; i < len; ++i) {
                    url = pendingUrls[i];
                    if (isCSS) {
                        node = env.gecko ? createNode("style") : createNode("link", {
                            href: url,
                            rel: "stylesheet"
                        });
                    } else {
                        node = createNode("script", {
                            src: url
                        });
                        node.async = false;
                    }
                    node.className = "lazyload";
                    node.setAttribute("charset", "utf-8");
                    if (env.ie && !isCSS && "onreadystatechange" in node && !("draggable" in node)) {
                        node.onreadystatechange = function() {
                            if (/loaded|complete/.test(node.readyState)) {
                                node.onreadystatechange = null;
                                _finish();
                            }
                        };
                    } else if (isCSS && (env.gecko || env.webkit)) {
                        if (env.webkit) {
                            p.urls[i] = node.href;
                            pollWebKit();
                        } else {
                            node.innerHTML = '@import "' + url + '";';
                            pollGecko(node);
                        }
                    } else {
                        node.onload = node.onerror = _finish;
                    }
                    nodes.push(node);
                }
                for (i = 0, len = nodes.length; i < len; ++i) {
                    head.appendChild(nodes[i]);
                }
            }
            function pollGecko(node) {
                var hasRules;
                try {
                    hasRules = !!node.sheet.cssRules;
                } catch (ex) {
                    pollCount += 1;
                    if (pollCount < 200) {
                        setTimeout(function() {
                            pollGecko(node);
                        }, 50);
                    } else {
                        hasRules && finish("css");
                    }
                    return;
                }
                finish("css");
            }
            function pollWebKit() {
                var css = pending.css, i;
                if (css) {
                    i = styleSheets.length;
                    while (--i >= 0) {
                        if (styleSheets[i].href === css.urls[0]) {
                            finish("css");
                            break;
                        }
                    }
                    pollCount += 1;
                    if (css) {
                        if (pollCount < 200) {
                            setTimeout(pollWebKit, 50);
                        } else {
                            finish("css");
                        }
                    }
                }
            }
            return {
                css: function(urls, callback, obj, context) {
                    load("css", urls, callback, obj, context);
                },
                js: function(urls, callback, obj, context) {
                    load("js", urls, callback, obj, context);
                },
                load: function(urls, callback) {
                    var count = 0;
                    urls = toArray(urls);
                    var len = urls ? urls.length : 0;
                    function incCount() {
                        if (++count === urls.length) {
                            callback();
                        }
                    }
                    for (var i = 0; i < len; i++) {
                        var url = urls[i];
                        if (/.js$/im.test(url)) {
                            this.js(url, incCount);
                        } else if (/.css$/im.test(url)) {
                            this.css(url, incCount);
                        } else {
                            console.warn("Unkown type: " + url);
                        }
                    }
                }
            };
        }(window.document);
    });
    //! src/utils/browser/localStorage.js
    define("localStorage", [ "dispatcher" ], function(dispatcher) {
        var ls = function() {
            var api = {
                events: {
                    WARNING: "localStorage:warning",
                    ERROR: "localStorage:error"
                },
                UNSUPPORTED: "LOCAL_STORAGE_NOT_SUPPORTED"
            }, pfx = "global", prefix = pfx + ":";
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
            api.prefix = function(value) {
                if (value !== undefined) {
                    pfx = value;
                    prefix = pfx + ":";
                }
                return pfx;
            };
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
        return ls;
    });
    //! src/utils/browser/pageVisibility.js
    define("pageVisibility", [ "dispatcher" ], function(dispatcher) {
        var hidden = "hidden", CHANGE = "pageVisibility::change", doc = document, visible = false, result = {};
        dispatcher(result);
        if (hidden in doc) {
            doc.addEventListener("visibilitychange", onchange);
        } else if ((hidden = "mozHidden") in doc) {
            doc.addEventListener("mozvisibilitychange", onchange);
        } else if ((hidden = "webkitHidden") in doc) {
            doc.addEventListener("webkitvisibilitychange", onchange);
        } else if ((hidden = "msHidden") in doc) {
            doc.addEventListener("msvisibilitychange", onchange);
        } else if ("onfocusin" in doc) {
            doc.onfocusin = doc.onfocusout = onchange;
        } else {
            window.onpageshow = window.onpagehide = window.onfocus = window.onblur = onchange;
        }
        function onchange(evt) {
            var v = "visible", h = "hidden", value, evtMap = {
                focus: v,
                focusin: v,
                pageshow: v,
                blur: h,
                focusout: h,
                pagehide: h
            };
            evt = evt || window.event;
            value = evt.type in evtMap ? evtMap[evt.type] : this[hidden];
            visible = doc[hidden] !== "undefined" ? doc["hidden"] : value === v || h;
            if (visible) {
                doc.body.classList.remove("page-hidden");
                doc.body.classList.add("page-visible");
            } else {
                doc.body.classList.add("page-hidden");
                doc.body.classList.remove("page-visible");
            }
            result.visible = visible;
            result.dispatch(CHANGE, visible);
        }
        if (doc[hidden] !== undefined) {
            onchange({
                type: doc[hidden] ? "blur" : "focus"
            });
        }
        return result;
    });
    //! src/utils/browser/ready.js
    define("ready", function() {
        var callbacks = [], win = window, doc = document, ADD_EVENT_LISTENER = "addEventListener", REMOVE_EVENT_LISTENER = "removeEventListener", ATTACH_EVENT = "attachEvent", DETACH_EVENT = "detachEvent", DOM_CONTENT_LOADED = "DOMContentLoaded", ON_READY_STATE_CHANGE = "onreadystatechange", COMPLETE = "complete", READY_STATE = "readyState";
        var ready = function(callback) {
            callbacks.push(callback);
            if (doc[READY_STATE] === COMPLETE) {
                setTimeout(invokeCallbacks);
            }
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
        if (doc[ADD_EVENT_LISTENER]) {
            DOMContentLoaded = function() {
                doc[REMOVE_EVENT_LISTENER](DOM_CONTENT_LOADED, DOMContentLoaded, false);
                invokeCallbacks();
            };
        } else if (doc.attachEvent) {
            DOMContentLoaded = function() {
                if (doc[READY_STATE] === COMPLETE) {
                    doc[DETACH_EVENT](ON_READY_STATE_CHANGE, DOMContentLoaded);
                    invokeCallbacks();
                }
            };
        }
        if (doc[READY_STATE] === COMPLETE) {
            setTimeout(invokeCallbacks, 1);
        }
        if (doc[ADD_EVENT_LISTENER]) {
            doc[ADD_EVENT_LISTENER](DOM_CONTENT_LOADED, DOMContentLoaded, false);
            win[ADD_EVENT_LISTENER]("load", invokeCallbacks, false);
        } else if (doc[ATTACH_EVENT]) {
            doc[ATTACH_EVENT](ON_READY_STATE_CHANGE, DOMContentLoaded);
            win[ATTACH_EVENT]("onload", invokeCallbacks);
        }
        return ready;
    });
    //! src/utils/color/shades.js
    define("shades", function() {
        var shades = function(percents, rgbColors) {
            var i = 0, len = percents ? percents.length : 0, percentColors = [], defaultPercentColors = [ {
                pct: 0,
                color: {
                    r: 0,
                    g: 153,
                    b: 0
                }
            }, {
                pct: .5,
                color: {
                    r: 255,
                    g: 255,
                    b: 0
                }
            }, {
                pct: 1,
                color: {
                    r: 255,
                    g: 0,
                    b: 0
                }
            } ];
            if (percents && rgbColors) {
                while (i < len) {
                    percentColors.push(percents[i], rgbColors[i]);
                    i += 1;
                }
            } else if (percents) {
                percentColors = percents;
            } else {
                percentColors = defaultPercentColors;
            }
            function getRGB(pct) {
                var i = 0, len = percentColors.length, lower, upper, range, rangePct, pctLower, pctUpper, color, result;
                if (pct >= 1) {
                    i = len;
                }
                while (i < len) {
                    if (pct <= percentColors[i].pct) {
                        lower = i === 0 ? percentColors[i] : percentColors[i - 1];
                        upper = i === 0 ? percentColors[i + 1] : percentColors[i];
                        range = upper.pct - lower.pct;
                        rangePct = (pct - lower.pct) / range;
                        pctLower = 1 - rangePct;
                        pctUpper = rangePct;
                        color = {
                            r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
                            g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
                            b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
                        };
                        return color;
                    }
                    i += 1;
                }
                color = percentColors[percentColors.length - 1].color;
                return color;
            }
            function convertRGBToStr(rgb) {
                return "rgb(" + [ rgb.r, rgb.g, rgb.b ].join(",") + ")";
            }
            function getRGBStr(percent) {
                var rgb = getRGB(percent);
                return convertRGBToStr(rgb);
            }
            return {
                getRGB: getRGB,
                getRGBStr: getRGBStr,
                convertRGBToStr: convertRGBToStr
            };
        }();
        return shades;
    });
    //! src/utils/crypt/decrypt.js
    define("decrypt", function() {
        /**
     * Decrypt 0.1
     * @license MIT or new BSD license
     * @desc Source found on Internet but source unknown
     */
        return function decrypt(str, pwd) {
            if (str === null || str.length < 8) {
                return;
            }
            if (pwd === null || pwd.length <= 0) {
                return;
            }
            var prand = "", i;
            for (i = 0; i < pwd.length; i++) {
                prand += pwd.charCodeAt(i).toString();
            }
            var sPos = Math.floor(prand.length / 5);
            var mult = parseInt(prand.charAt(sPos) + prand.charAt(sPos * 2) + prand.charAt(sPos * 3) + prand.charAt(sPos * 4) + prand.charAt(sPos * 5), 10);
            var incr = Math.round(pwd.length / 2);
            var modu = Math.pow(2, 31) - 1;
            var salt = parseInt(str.substring(str.length - 8, str.length), 16);
            str = str.substring(0, str.length - 8);
            prand += salt;
            while (prand.length > 10) {
                prand = (parseInt(prand.substring(0, 10), 10) + parseInt(prand.substring(10, prand.length), 10)).toString();
            }
            prand = (mult * prand + incr) % modu;
            var enc_chr = "";
            var enc_str = "";
            for (i = 0; i < str.length; i += 2) {
                enc_chr = parseInt(parseInt(str.substring(i, i + 2), 16) ^ Math.floor(prand / modu * 255), 10);
                enc_str += String.fromCharCode(enc_chr);
                prand = (mult * prand + incr) % modu;
            }
            return enc_str;
        };
    });
    //! src/utils/crypt/encrypt.js
    define("encrypt", function() {
        function encrypt(str, pwd) {
            if (!pwd || pwd.length <= 0) {
                return null;
            }
            var prand = "";
            var i;
            for (i = 0; i < pwd.length; i++) {
                prand += pwd.charCodeAt(i).toString();
            }
            var sPos = Math.floor(prand.length / 5);
            var mult = parseInt(prand.charAt(sPos) + prand.charAt(sPos * 2) + prand.charAt(sPos * 3) + prand.charAt(sPos * 4) + prand.charAt(sPos * 5));
            var incr = Math.ceil(pwd.length / 2);
            var modu = Math.pow(2, 31) - 1;
            if (mult < 2) {
                return null;
            }
            var salt = Math.round(Math.random() * 1e9) % 1e8;
            prand += salt;
            while (prand.length > 10) {
                prand = (parseInt(prand.substring(0, 10)) + parseInt(prand.substring(10, prand.length))).toString();
            }
            prand = (mult * prand + incr) % modu;
            var enc_chr = "";
            var enc_str = "";
            for (i = 0; i < str.length; i++) {
                enc_chr = parseInt(str.charCodeAt(i) ^ Math.floor(prand / modu * 255));
                if (enc_chr < 16) {
                    enc_str += "0" + enc_chr.toString(16);
                } else {
                    enc_str += enc_chr.toString(16);
                }
                prand = (mult * prand + incr) % modu;
            }
            salt = salt.toString(16);
            while (salt.length < 8) {
                salt = "0" + salt;
            }
            enc_str += salt;
            return enc_str;
        }
        return encrypt;
    });
    //! src/utils/crypt/keygen.js
    define("keygen", function() {
        var keygen = function(pattern) {
            var defaultPattern = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
            return (pattern || defaultPattern).replace(/[xy]/g, function(b) {
                var d = 16 * Math.random() | 0;
                return ("x" == b ? d : d & 3 | 8).toString(16);
            });
        };
        return keygen;
    });
    //! src/utils/crypt/md5.js
    define("md5", function() {
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
        return md5;
    });
    //! src/utils/data/cache.js
    define("cache", function() {
        var cache = function() {
            var Cache, ns;
            ns = {};
            Cache = function() {
                var _cachedItems = [];
                this.set = function(key, value) {
                    _cachedItems[key] = value;
                    return value;
                };
                this.get = function(key, defaultValue) {
                    if (_cachedItems.hasOwnProperty(key)) {
                        return _cachedItems[key];
                    }
                    return defaultValue;
                };
                this.getCopy = function(key, defaultValue, overwrite) {
                    var data = this.get(key, defaultValue, overwrite);
                    return data.copy(data);
                };
                this.merge = function(key, value) {
                    if (_cachedItems[key]) {
                        _cachedItems[key] = extend(_cachedItems[key], value);
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
                    return _cachedItems.hasOwnProperty(key);
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
        }();
        return cache;
    });
    //! src/utils/data/copy.js
    define("copy", [ "isWindow", "isArray", "isDate", "isRegExp", "isObject" ], function(isWindow, isArray, isDate, isRegExp, isObject) {
        var copy = function(source, destination, stackSource, stackDest) {
            if (isWindow(source)) {
                throw Error("Can't copy! Making copies of Window instances is not supported.");
            }
            if (!destination) {
                destination = source;
                if (source) {
                    if (isArray(source)) {
                        destination = data.copy(source, [], stackSource, stackDest);
                    } else if (isDate(source)) {
                        destination = new Date(source.getTime());
                    } else if (isRegExp(source)) {
                        destination = new RegExp(source.source);
                    } else if (isObject(source)) {
                        destination = copy(source, {}, stackSource, stackDest);
                    }
                }
            } else {
                if (source === destination) {
                    throw Error("Can't copy! Source and destination are identical.");
                }
                stackSource = stackSource || [];
                stackDest = stackDest || [];
                if (isObject(source)) {
                    var index = stackSource.indexOf(source);
                    if (index !== -1) {
                        return stackDest[index];
                    }
                    stackSource.push(source);
                    stackDest.push(destination);
                }
                var result;
                if (isArray(source)) {
                    destination.length = 0;
                    for (var i = 0; i < source.length; i++) {
                        result = copy(source[i], null, stackSource, stackDest);
                        if (isObject(source[i])) {
                            stackSource.push(source[i]);
                            stackDest.push(result);
                        }
                        destination.push(result);
                    }
                } else {
                    for (var e in destination) {
                        delete destination[e];
                    }
                    for (var key in source) {
                        result = copy(source[key], null, stackSource, stackDest);
                        if (isObject(source[key])) {
                            stackSource.push(source[key]);
                            stackDest.push(result);
                        }
                        destination[key] = result;
                    }
                }
            }
            return destination;
        };
        return copy;
    });
    //! src/utils/validators/isWindow.js
    define("isWindow", function() {
        var isWindow = function(obj) {
            return obj && obj.document && obj.location && obj.alert && obj.setInterval;
        };
        return isWindow;
    });
    //! src/utils/validators/isDate.js
    define("isDate", function() {
        var isDate = function(val) {
            return val instanceof Date;
        };
        return isDate;
    });
    //! src/utils/validators/isObject.js
    define("isObject", function() {
        var isObject = function(val) {
            return val !== null && typeof val === "object";
        };
        return isObject;
    });
    //! src/utils/data/diff.js
    define("diff", [ "isDate", "isObject", "isEmpty", "isArray" ], function(isDate, isObject, isEmpty, isArray) {
        var diff = function(source, target) {
            var returnVal = {}, dateStr;
            for (var name in target) {
                if (name in source) {
                    if (isDate(target[name])) {
                        dateStr = isDate(source[name]) ? source[name].toISOString() : source[name];
                        if (target[name].toISOString() !== dateStr) {
                            returnVal[name] = target[name];
                        }
                    } else if (isObject(target[name]) && !isArray(target[name])) {
                        var result = diff(source[name], target[name]);
                        if (!isEmpty(result)) {
                            returnVal[name] = result;
                        }
                    } else if (!isEqual(source[name], target[name])) {
                        returnVal[name] = target[name];
                    }
                } else {
                    returnVal[name] = target[name];
                }
            }
            if (isEmpty(returnVal)) {
                return null;
            }
            return returnVal;
        };
        return diff;
    });
    //! src/utils/validators/isEmpty.js
    define("isEmpty", [ "isString", "isArray", "isObject" ], function(isString, isArray, isObject) {
        var isEmpty = function(val) {
            if (val === null) {
                return true;
            }
            if (isString(val)) {
                return val === "";
            }
            if (isArray(val)) {
                return val.length === 0;
            }
            if (isObject(val)) {
                for (var e in val) {
                    return false;
                }
                return true;
            }
            return false;
        };
        return isEmpty;
    });
    //! src/utils/validators/isString.js
    define("isString", function() {
        var isString = function(val) {
            return typeof val === "string";
        };
        return isString;
    });
    //! src/utils/data/extend.js
    define("extend", [ "toArray" ], function(toArray) {
        var extend = function(target, source) {
            var args = toArray(arguments), i = 1, len = args.length, item, j;
            var options = this || {}, copy;
            while (i < len) {
                item = args[i];
                for (j in item) {
                    if (item.hasOwnProperty(j)) {
                        if (j === "length" && target instanceof Array) {} else if (target[j] && typeof target[j] === "object" && !item[j] instanceof Array) {
                            target[j] = extend.apply(options, [ target[j], item[j] ]);
                        } else if (item[j] instanceof Array) {
                            copy = options && options.concat ? (target[j] || []).concat(item[j]) : item[j];
                            if (options && options.arrayAsObject) {
                                if (!target[j]) {
                                    target[j] = {
                                        length: copy.length
                                    };
                                }
                                if (target[j] instanceof Array) {
                                    target[j] = extend.apply(options, [ {}, target[j] ]);
                                }
                            } else {
                                target[j] = target[j] || [];
                            }
                            if (copy.length) {
                                target[j] = extend.apply(options, [ target[j], copy ]);
                            }
                        } else if (item[j] && typeof item[j] === "object") {
                            if (options.objectAsArray && typeof item[j].length === "number") {
                                if (!(target[j] instanceof Array)) {
                                    target[j] = extend.apply(options, [ [], target[j] ]);
                                }
                            }
                            target[j] = extend.apply(options, [ target[j] || {}, item[j] ]);
                        } else if (options.override !== false || target[j] === undefined) {
                            target[j] = item[j];
                        }
                    }
                }
                i += 1;
            }
            return target;
        };
        return extend;
    });
    //! src/utils/data/filter.js
    define("filter", function() {
        var filter = function(list, method) {
            var i = 0, len, result = [], extraArgs, response;
            if (arguments.length > 2) {
                extraArgs = Array.prototype.slice.apply(arguments);
                extraArgs.splice(0, 2);
            }
            if (list && list.length) {
                len = list.length;
                while (i < len) {
                    response = method.apply(null, [ list[i], i, list ].concat(extraArgs));
                    if (response) {
                        result.push(list[i]);
                    }
                    i += 1;
                }
            } else {
                for (i in list) {
                    if (list.hasOwnProperty(i)) {
                        response = method.apply(null, [ list[i], i, list ].concat(extraArgs));
                        if (response) {
                            result.push(list[i]);
                        }
                    }
                }
            }
            return result;
        };
        return filter;
    });
    //! src/utils/data/memory.js
    define("memory", function() {
        var memory = {
            getSize: function(obj) {
                return this.getBytesSize(this.sizeOfObject(obj));
            },
            sizeOfObject: function(value, level) {
                if (level == undefined) level = 0;
                var bytes = 0, i;
                if (value === null || value === undefined) {
                    bytes = 0;
                } else if (typeof value === "boolean") {
                    bytes = 4;
                } else if (typeof value === "string") {
                    bytes = value.length * 2;
                } else if (typeof value === "number") {
                    bytes = 8;
                } else if (typeof value === "object") {
                    if (value["__visited__"]) return 0;
                    value["__visited__"] = 1;
                    for (i in value) {
                        if (value.hasOwnProperty(i)) {
                            bytes += i.length * 2;
                            bytes += 8;
                            bytes += this.sizeOfObject(value[i], 1);
                        }
                    }
                }
                if (level == 0) {
                    this._clearReferenceTo(value);
                }
                return bytes;
            },
            _clearReferenceTo: function(value) {
                if (value && typeof value == "object") {
                    delete value["__visited__"];
                    for (var i in value) {
                        this._clearReferenceTo(value[i]);
                    }
                }
            },
            getBytesSize: function(bytes) {
                if (bytes > 1024 && bytes < 1024 * 1024) {
                    return (bytes / 1024).toFixed(2) + "K";
                } else if (bytes > 1024 * 1024 && bytes < 1024 * 1024 * 1024) {
                    return (bytes / (1024 * 1024)).toFixed(2) + "M";
                } else if (bytes > 1024 * 1024 * 1024) {
                    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + "G";
                }
                return bytes.toString();
            }
        };
        return memory;
    });
    //! src/utils/data/resolve.js
    define("resolve", [ "isUndefined" ], function(isUndefined) {
        function Resolve(data) {
            this.data = data || {};
        }
        var proto = Resolve.prototype;
        proto.get = function(path, delimiter) {
            path = path || "";
            var arr = path.split(delimiter || "."), space = "", i = 0, len = arr.length;
            var data = this.data;
            while (i < len) {
                space = arr[i];
                data = data[space];
                if (data === undefined) {
                    break;
                }
                i += 1;
            }
            return data;
        };
        proto.set = function(path, value, delimiter) {
            if (isUndefined(path)) {
                throw new Error('Resolve requires "path"');
            }
            var arr = path.split(delimiter || "."), space = "", i = 0, len = arr.length - 1;
            var data = this.data;
            while (i < len) {
                space = arr[i];
                if (data[space] === undefined) {
                    data = data[space] = {};
                } else {
                    data = data[space];
                }
                i += 1;
            }
            if (arr.length > 0) {
                data[arr.pop()] = value;
            }
            return this.data;
        };
        proto.clear = function() {
            var d = this.data;
            for (var e in d) {
                if (d.hasOwnProperty(e)) {
                    delete d[e];
                }
            }
        };
        proto.path = function(path) {
            return this.set(path, {});
        };
        var resolve = function(data) {
            return new Resolve(data);
        };
        return resolve;
    });
    //! src/utils/data/shallowCopy.js
    define("shallowCopy", [ "isArray", "isObject" ], function(isArray, isObject) {
        var shallowCopy = function(src, dest, ignorePrefix) {
            if (isArray(src)) {
                dest = dest || [];
                for (var i = 0; i < src.length; i++) {
                    dest[i] = src[i];
                }
            } else if (isObject(src)) {
                dest = dest || {};
                for (var key in src) {
                    if (src.hasOwnProperty(key) && !(key.charAt(0) === ignorePrefix && key.charAt(1) === ignorePrefix)) {
                        dest[key] = src[key];
                    }
                }
            }
            return dest || src;
        };
        return shallowCopy;
    });
    //! src/utils/data/size.js
    define("size", [ "isArray", "isString", "isObject" ], function(isArray, isString, isObject) {
        var size = function(obj, ownPropsOnly) {
            var count = 0, key;
            if (isArray(obj) || isString(obj)) {
                return obj.length;
            } else if (isObject(obj)) {
                for (key in obj) {
                    if (!ownPropsOnly || obj.hasOwnProperty(key)) {
                        count++;
                    }
                }
            }
            return count;
        };
        return size;
    });
    //! src/utils/data/sortObj.js
    define("sortObj", function() {
        return function(obj, type, caseSensitive) {
            var temp_array = [];
            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (!caseSensitive) {
                        key = key.toLowerCase ? key.toLowerCase() : key;
                    }
                    temp_array.push(key);
                }
            }
            if (typeof type === "function") {
                temp_array.sort(type);
            } else if (type === "value") {
                temp_array.sort(function(a, b) {
                    var x = obj[a];
                    var y = obj[b];
                    if (!caseSensitive) {
                        x = x.toLowerCase ? x.toLowerCase() : x;
                        y = y.toLowerCase ? y.toLowerCase() : y;
                    }
                    return x < y ? -1 : x > y ? 1 : 0;
                });
            } else {
                temp_array.sort();
            }
            var temp_obj = {};
            for (var i = 0; i < temp_array.length; i++) {
                temp_obj[temp_array[i]] = obj[temp_array[i]];
            }
            return temp_obj;
        };
    });
    //! src/utils/display/align.js
    internal("align", function() {
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
        return Align;
    });
    //! src/utils/display/display.js
    define("display", [ "align", "sorting" ], function(align, sorting) {
        return {
            align: function() {
                return new align();
            },
            sorting: function() {
                return new sorting();
            }
        };
    });
    //! src/utils/display/sorting.js
    internal("sorting", function() {
        var Sorting = function() {
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
        return Sorting;
    });
    //! src/utils/ease/easeInBack.js
    define("easeInBack", function() {
        return function(x, t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            return c * (t /= d) * t * ((s + 1) * t - s) + b;
        };
    });
    //! src/utils/ease/easeInBounce.js
    define("easeInBounce", [ "easeOutBounce" ], function(easeOutBounce) {
        return function(x, t, b, c, d) {
            return c - easeOutBounce(x, d - t, 0, c, d) + b;
        };
    });
    //! src/utils/ease/easeOutBounce.js
    define("easeOutBounce", function() {
        return function(x, t, b, c, d) {
            if ((t /= d) < 1 / 2.75) {
                return c * (7.5625 * t * t) + b;
            } else if (t < 2 / 2.75) {
                return c * (7.5625 * (t -= 1.5 / 2.75) * t + .75) + b;
            } else if (t < 2.5 / 2.75) {
                return c * (7.5625 * (t -= 2.25 / 2.75) * t + .9375) + b;
            } else {
                return c * (7.5625 * (t -= 2.625 / 2.75) * t + .984375) + b;
            }
        };
    });
    //! src/utils/ease/easeInCirc.js
    define("easeInCirc", function() {
        return function(x, t, b, c, d) {
            return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
        };
    });
    //! src/utils/ease/easeInCubic.js
    define("easeInCubic", function() {
        return function(x, t, b, c, d) {
            return c * (t /= d) * t * t + b;
        };
    });
    //! src/utils/ease/easeInElastic.js
    define("easeInElastic", function() {
        return function(x, t, b, c, d) {
            var s = 1.70158;
            var p = 0;
            var a = c;
            if (t == 0) return b;
            if ((t /= d) == 1) return b + c;
            if (!p) p = d * .3;
            if (a < Math.abs(c)) {
                a = c;
                var s = p / 4;
            } else var s = p / (2 * Math.PI) * Math.asin(c / a);
            return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        };
    });
    //! src/utils/ease/easeInExpo.js
    define("easeInExpo", function() {
        return function(x, t, b, c, d) {
            return t == 0 ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
        };
    });
    //! src/utils/ease/easeInOutBack.js
    define("easeInOutBack", function() {
        return function(x, t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
            return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b;
        };
    });
    //! src/utils/ease/easeInOutBounce.js
    define("easeInOutBounce", [ "easeInBounce", "easeOutBounce" ], function(easeInBounce, easeOutBounce) {
        return function(x, t, b, c, d) {
            if (t < d / 2) return easeInBounce(x, t * 2, 0, c, d) * .5 + b;
            return easeOutBounce(x, t * 2 - d, 0, c, d) * .5 + c * .5 + b;
        };
    });
    //! src/utils/ease/easeInOutCirc.js
    define("easeInOutCirc", function() {
        return function(x, t, b, c, d) {
            if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
            return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
        };
    });
    //! src/utils/ease/easeInOutCubic.js
    define("easeInOutCubic", function() {
        return function(x, t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
            return c / 2 * ((t -= 2) * t * t + 2) + b;
        };
    });
    //! src/utils/ease/easeInOutElastic.js
    define("easeInOutElastic", function() {
        return function(x, t, b, c, d) {
            var s = 1.70158;
            var p = 0;
            var a = c;
            if (t == 0) return b;
            if ((t /= d / 2) == 2) return b + c;
            if (!p) p = d * (.3 * 1.5);
            if (a < Math.abs(c)) {
                a = c;
                var s = p / 4;
            } else var s = p / (2 * Math.PI) * Math.asin(c / a);
            if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
            return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
        };
    });
    //! src/utils/ease/easeInOutExpo.js
    define("easeInOutExpo", function() {
        return function(x, t, b, c, d) {
            if (t == 0) return b;
            if (t == d) return b + c;
            if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
            return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
        };
    });
    //! src/utils/ease/easeInOutQuad.js
    define("easeInOutQuad", function() {
        return function(x, t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t + b;
            return -c / 2 * (--t * (t - 2) - 1) + b;
        };
    });
    //! src/utils/ease/easeInOutQuart.js
    define("easeInOutQuart", function() {
        return function(x, t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
            return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
        };
    });
    //! src/utils/ease/easeInOutQuint.js
    define("easeInOutQuint", function() {
        return function(x, t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
            return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
        };
    });
    //! src/utils/ease/easeInOutSine.js
    define("easeInOutSine", function() {
        return function(x, t, b, c, d) {
            return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
        };
    });
    //! src/utils/ease/easeInQuad.js
    define("easeInQuad", function() {
        return function(x, t, b, c, d) {
            return c * (t /= d) * t + b;
        };
    });
    //! src/utils/ease/easeInQuart.js
    define("easeInQuart", function() {
        return function(x, t, b, c, d) {
            return c * (t /= d) * t * t * t + b;
        };
    });
    //! src/utils/ease/easeInQuint.js
    define("easeInQuint", function() {
        return function(x, t, b, c, d) {
            return c * (t /= d) * t * t * t * t + b;
        };
    });
    //! src/utils/ease/easeInSine.js
    define("easeInSine", function() {
        return function(x, t, b, c, d) {
            return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
        };
    });
    //! src/utils/ease/easeOutBack.js
    define("easeOutBack", function() {
        return function(x, t, b, c, d, s) {
            if (s == undefined) s = 1.70158;
            return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
        };
    });
    //! src/utils/ease/easeOutCirc.js
    define("easeOutCirc", function() {
        return function(x, t, b, c, d) {
            return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
        };
    });
    //! src/utils/ease/easeOutCubic.js
    define("easeOutCubic", function() {
        return function(x, t, b, c, d) {
            return c * ((t = t / d - 1) * t * t + 1) + b;
        };
    });
    //! src/utils/ease/easeOutElastic.js
    define("easeOutElastic", function() {
        return function(x, t, b, c, d) {
            var s = 1.70158;
            var p = 0;
            var a = c;
            if (t == 0) return b;
            if ((t /= d) == 1) return b + c;
            if (!p) p = d * .3;
            if (a < Math.abs(c)) {
                a = c;
                var s = p / 4;
            } else var s = p / (2 * Math.PI) * Math.asin(c / a);
            return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
        };
    });
    //! src/utils/ease/easeOutExpo.js
    define("easeOutExpo", function() {
        return function(x, t, b, c, d) {
            return t == d ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
        };
    });
    //! src/utils/ease/easeOutQuad.js
    define("easeOutQuad", function() {
        return function(x, t, b, c, d) {
            return -c * (t /= d) * (t - 2) + b;
        };
    });
    //! src/utils/ease/easeOutQuart.js
    define("easeOutQuart", function() {
        return function(x, t, b, c, d) {
            return -c * ((t = t / d - 1) * t * t * t - 1) + b;
        };
    });
    //! src/utils/ease/easeOutQuint.js
    define("easeOutQuint", function() {
        return function(x, t, b, c, d) {
            return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
        };
    });
    //! src/utils/ease/easeOutSine.js
    define("easeOutSine", function() {
        return function(x, t, b, c, d) {
            return c * Math.sin(t / d * (Math.PI / 2)) + b;
        };
    });
    //! src/utils/formatters/capitalize.js
    define("capitalize", function() {
        return function(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        };
    });
    //! src/utils/formatters/decodeHTML.js
    define("decodeHTML", function() {
        return function(string, quote_style) {
            var optTemp = 0, i = 0, noquotes = false;
            if (typeof quote_style === "undefined") {
                quote_style = 2;
            }
            string = string.toString().replace(/&lt;/g, "<").replace(/&gt;/g, ">");
            var OPTS = {
                ENT_NOQUOTES: 0,
                ENT_HTML_QUOTE_SINGLE: 1,
                ENT_HTML_QUOTE_DOUBLE: 2,
                ENT_COMPAT: 2,
                ENT_QUOTES: 3,
                ENT_IGNORE: 4
            };
            if (quote_style === 0) {
                noquotes = true;
            }
            if (typeof quote_style !== "number") {
                quote_style = [].concat(quote_style);
                for (i = 0; i < quote_style.length; i++) {
                    if (OPTS[quote_style[i]] === 0) {
                        noquotes = true;
                    } else if (OPTS[quote_style[i]]) {
                        optTemp = optTemp | OPTS[quote_style[i]];
                    }
                }
                quote_style = optTemp;
            }
            if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
                string = string.replace(/&#0*39;/g, "'");
            }
            if (!noquotes) {
                string = string.replace(/&quot;/g, '"');
            }
            string = string.replace(/&amp;/g, "&");
            return string;
        };
    });
    //! src/utils/formatters/escapeRegExp.js
    define("escapeRegExp", function() {
        return function(str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        };
    });
    //! src/utils/formatters/fromCamelToDash.js
    define("fromCamelToDash", function() {
        return function(str) {
            return str.replace(/([A-Z])/g, function(g) {
                return "-" + g.toLowerCase();
            });
        };
    });
    //! src/utils/formatters/fromDashToCamel.js
    define("fromDashToCamel", function() {
        return function(str) {
            return str.replace(/-([a-z])/g, function(g) {
                return g[1].toUpperCase();
            });
        };
    });
    //! src/utils/formatters/fromJson.js
    define("fromJson", function() {
        var fromJson = function(source, jsonObjectFormat) {
            if (typeof jsonObjectFormat === "undefined") {
                jsonObjectFormat = true;
            }
            var object_start = jsonObjectFormat ? "{" : "(";
            var object_end = jsonObjectFormat ? "}" : ")";
            var pair_seperator = jsonObjectFormat ? ":" : "=";
            var at = 0;
            var ch = " ";
            var escapee = {
                '"': '"',
                "'": "'",
                "\\": "\\",
                "/": "/",
                b: "\b",
                f: "\f",
                n: "\n",
                r: "\r",
                t: "	"
            };
            var text = source;
            var result = readValue();
            skipWhitespace();
            if (ch) {
                raiseError("Syntax error");
            }
            return result;
            function raiseError(m) {
                throw {
                    name: "SyntaxError",
                    message: m,
                    at: at,
                    text: text
                };
            }
            function next(c) {
                if (c && c !== ch) {
                    raiseError("Expected '" + c + "' instead of '" + ch + "'");
                }
                ch = text.charAt(at);
                at += 1;
                return ch;
            }
            function readString() {
                var s = "";
                if (ch === '"' || ch === "'") {
                    while (next()) {
                        if (ch === '"' || ch === "'") {
                            next();
                            return s;
                        }
                        if (ch === "\\") {
                            next();
                            if (ch === "u") {
                                var uffff = 0;
                                for (var i = 0; i < 4; i += 1) {
                                    var hex = parseInt(next(), 16);
                                    if (!isFinite(hex)) {
                                        break;
                                    }
                                    uffff = uffff * 16 + hex;
                                }
                                s += String.fromCharCode(uffff);
                            } else if (typeof escapee[ch] === "string") {
                                s += escapee[ch];
                            } else {
                                break;
                            }
                        } else {
                            s += ch;
                        }
                    }
                }
                raiseError("Bad string");
            }
            function skipWhitespace() {
                while (ch && ch <= " ") {
                    next();
                }
            }
            function readWord() {
                var s = "";
                while (allowedInWord()) {
                    s += ch;
                    next();
                }
                if (s === "true") {
                    return true;
                }
                if (s === "false") {
                    return false;
                }
                if (s === "null") {
                    return null;
                }
                if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(s)) {
                    return parseFloat(s);
                }
                return s;
            }
            function readArray() {
                var array = [];
                if (ch === "[") {
                    next("[");
                    skipWhitespace();
                    if (ch === "]") {
                        next("]");
                        return array;
                    }
                    while (ch) {
                        array.push(readValue());
                        skipWhitespace();
                        if (ch === "]") {
                            next("]");
                            return array;
                        }
                        next(",");
                        skipWhitespace();
                    }
                }
                raiseError("Bad array");
            }
            function readObject() {
                var o = {};
                if (ch === object_start) {
                    next(object_start);
                    skipWhitespace();
                    if (ch === object_end) {
                        next(object_end);
                        return o;
                    }
                    while (ch) {
                        var key = ch === '"' || ch === "'" ? readString() : readWord();
                        if (typeof key !== "string") {
                            raiseError("Bad object key: " + key);
                        }
                        skipWhitespace();
                        next(pair_seperator);
                        if (Object.hasOwnProperty.call(o, key)) {
                            raiseError('Duplicate key: "' + key + '"');
                        }
                        o[key] = readValue();
                        skipWhitespace();
                        if (ch === object_end) {
                            next(object_end);
                            return o;
                        }
                        next(",");
                        skipWhitespace();
                    }
                }
                raiseError("Bad object");
            }
            function readValue() {
                skipWhitespace();
                switch (ch) {
                  case object_start:
                    return readObject();

                  case "[":
                    return readArray();

                  case '"':
                    return readString();

                  case "'":
                    return readString();

                  default:
                    return readWord();
                }
            }
            function allowedInWord() {
                switch (ch) {
                  case '"':
                  case "'":
                  case "\\":
                  case "	":
                  case "\n":
                  case "\r":
                  case ",":
                  case "[":
                  case "]":
                  case object_start:
                  case object_end:
                  case pair_seperator:
                    return false;
                }
                return ch > " ";
            }
        };
        return fromJson;
    });
    //! src/utils/formatters/fromXML.js
    define("fromXML", function() {
        var strToXML = function(str) {
            var parser, xmlDoc;
            if (window.DOMParser) {
                parser = new DOMParser();
                xmlDoc = parser.parseFromString(str, "text/xml");
            } else {
                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = false;
                xmlDoc.loadXML(str);
            }
            return xmlDoc;
        };
        var fromXML = function(node) {
            if (typeof node === "string") {
                node = strToXML(node).firstElementChild;
            }
            var data = {};
            function convertValue(value) {
                if (isNaN(value)) {
                    if (value === "true") {
                        return true;
                    }
                    if (value === "false") {
                        return false;
                    }
                    return value;
                }
                return Number(value);
            }
            function setValue(key, value) {
                if (data[key]) {
                    if (data[key].constructor !== Array) {
                        data[key] = [ data[key] ];
                    }
                    data[key][data[key].length] = convertValue(value);
                } else {
                    data[key] = convertValue(value);
                }
            }
            function setText(key, value) {
                if (data[key].constructor === Array) {
                    data[key][data[key].length - 1].text = value;
                } else {
                    data[key].text = value;
                }
            }
            var c, cn;
            if (node.attributes) {
                for (c = 0; node.attributes[c]; c++) {
                    cn = node.attributes[c];
                    setValue(cn.name, cn.value);
                }
            }
            if (node.childNodes) {
                for (c = 0; node.childNodes[c]; c++) {
                    cn = node.childNodes[c];
                    if (cn.nodeType === 1) {
                        if (cn.childNodes.length === 1 && cn.firstChild.nodeType === 3) {
                            if (cn.attributes.length) {
                                setValue(cn.nodeName, fromXML(cn));
                                setText(cn.nodeName, cn.firstChild.nodeValue);
                            } else {
                                setValue(cn.nodeName, cn.firstChild.nodeValue);
                            }
                        } else {
                            setValue(cn.nodeName, fromXML(cn));
                        }
                    } else if (cn.nodeType === 4) {
                        data = cn.data;
                        break;
                    }
                }
            }
            return data;
        };
        return fromXML;
    });
    //! src/utils/formatters/inflection.js
    define("inflection", function() {
        var inflections = {
            plurals: [],
            singulars: [],
            uncountables: [],
            humans: []
        };
        var PLURALS = inflections.plurals, SINGULARS = inflections.singulars, UNCOUNTABLES = inflections.uncountables, HUMANS = inflections.humans;
        var plural = function(rule, replacement) {
            inflections.plurals.unshift([ rule, replacement ]);
        };
        var singular = function(rule, replacement) {
            inflections.singulars.unshift([ rule, replacement ]);
        };
        var uncountable = function(word) {
            inflections.uncountables.unshift(word);
        };
        var irregular = function(s, p) {
            if (s.substr(0, 1).toUpperCase() === p.substr(0, 1).toUpperCase()) {
                plural(new RegExp("(" + s.substr(0, 1) + ")" + s.substr(1) + "$", "i"), "$1" + p.substr(1));
                plural(new RegExp("(" + p.substr(0, 1) + ")" + p.substr(1) + "$", "i"), "$1" + p.substr(1));
                singular(new RegExp("(" + p.substr(0, 1) + ")" + p.substr(1) + "$", "i"), "$1" + s.substr(1));
            } else {
                plural(new RegExp(s.substr(0, 1).toUpperCase() + s.substr(1) + "$"), p.substr(0, 1).toUpperCase() + p.substr(1));
                plural(new RegExp(s.substr(0, 1).toLowerCase() + s.substr(1) + "$"), p.substr(0, 1).toLowerCase() + p.substr(1));
                plural(new RegExp(p.substr(0, 1).toUpperCase() + p.substr(1) + "$"), p.substr(0, 1).toUpperCase() + p.substr(1));
                plural(new RegExp(p.substr(0, 1).toLowerCase() + p.substr(1) + "$"), p.substr(0, 1).toLowerCase() + p.substr(1));
                singular(new RegExp(p.substr(0, 1).toUpperCase() + p.substr(1) + "$"), s.substr(0, 1).toUpperCase() + s.substr(1));
                singular(new RegExp(p.substr(0, 1).toLowerCase() + p.substr(1) + "$"), s.substr(0, 1).toLowerCase() + s.substr(1));
            }
        };
        var human = function(rule, replacement) {
            inflections.humans.push([ rule, replacement ]);
        };
        plural(/$/, "s");
        plural(/s$/i, "s");
        plural(/(ax|test)is$/i, "$1es");
        plural(/(octop|vir)us$/i, "$1i");
        plural(/(alias|status)$/i, "$1es");
        plural(/(bu)s$/i, "$1ses");
        plural(/(buffal|tomat)o$/i, "$1oes");
        plural(/([ti])um$/i, "$1a");
        plural(/sis$/i, "ses");
        plural(/(?:([^f])fe|([lr])f)$/i, "$1$2ves");
        plural(/(hive)$/i, "$1s");
        plural(/([^aeiouy]|qu)y$/i, "$1ies");
        plural(/(x|ch|ss|sh)$/i, "$1es");
        plural(/(matr|vert|ind)(?:ix|ex)$/i, "$1ices");
        plural(/([m|l])ouse$/i, "$1ice");
        plural(/^(ox)$/i, "$1en");
        plural(/(quiz)$/i, "$1zes");
        singular(/s$/i, "");
        singular(/(n)ews$/i, "$1ews");
        singular(/([ti])a$/i, "$1um");
        singular(/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, "$1$2sis");
        singular(/(^analy)ses$/i, "$1sis");
        singular(/([^f])ves$/i, "$1fe");
        singular(/(hive)s$/i, "$1");
        singular(/(tive)s$/i, "$1");
        singular(/([lr])ves$/i, "$1f");
        singular(/([^aeiouy]|qu)ies$/i, "$1y");
        singular(/(s)eries$/i, "$1eries");
        singular(/(m)ovies$/i, "$1ovie");
        singular(/(x|ch|ss|sh)es$/i, "$1");
        singular(/([m|l])ice$/i, "$1ouse");
        singular(/(bus)es$/i, "$1");
        singular(/(o)es$/i, "$1");
        singular(/(shoe)s$/i, "$1");
        singular(/(cris|ax|test)es$/i, "$1is");
        singular(/(octop|vir)i$/i, "$1us");
        singular(/(alias|status)es$/i, "$1");
        singular(/^(ox)en/i, "$1");
        singular(/(vert|ind)ices$/i, "$1ex");
        singular(/(matr)ices$/i, "$1ix");
        singular(/(quiz)zes$/i, "$1");
        singular(/(database)s$/i, "$1");
        irregular("person", "people");
        irregular("man", "men");
        irregular("child", "children");
        irregular("sex", "sexes");
        irregular("move", "moves");
        irregular("cow", "kine");
        uncountable("equipment");
        uncountable("information");
        uncountable("rice");
        uncountable("money");
        uncountable("species");
        uncountable("series");
        uncountable("fish");
        uncountable("sheep");
        uncountable("jeans");
        var pluralize = function(word) {
            var wlc = word.toLowerCase();
            var i;
            for (i = 0; i < UNCOUNTABLES.length; i++) {
                var uncountable = UNCOUNTABLES[i];
                if (wlc === uncountable) {
                    return word;
                }
            }
            for (i = 0; i < PLURALS.length; i++) {
                var rule = PLURALS[i][0], replacement = PLURALS[i][1];
                if (rule.test(word)) {
                    return word.replace(rule, replacement);
                }
            }
        };
        var singularize = function(word) {
            var wlc = word.toLowerCase();
            var i;
            for (i = 0; i < UNCOUNTABLES.length; i++) {
                var uncountable = UNCOUNTABLES[i];
                if (wlc === uncountable) {
                    return word;
                }
            }
            for (i = 0; i < SINGULARS.length; i++) {
                var rule = SINGULARS[i][0], replacement = SINGULARS[i][1];
                if (rule.test(word)) {
                    return word.replace(rule, replacement);
                }
            }
        };
        var humanize = function(word) {
            for (var i = 0; i < HUMANS.length; i++) {
                var rule = HUMANS[i][0], replacement = HUMANS[i][1];
                if (rule.test(word)) {
                    word = word.replace(rule, replacement);
                }
            }
            return camelToTerms(word, " ").toLowerCase();
        };
        var camelToTerms = function(word, delim) {
            delim = delim || " ";
            var replacement = "$1" + delim + "$2";
            return word.replace(/([A-Z]+)([A-Z][a-z])/g, replacement).replace(/([a-z\d])([A-Z])/g, replacement);
        };
        var underscore = function(word) {
            return camelToTerms(word, "_").toLowerCase();
        };
        var dasherize = function(word) {
            return camelToTerms(word, "-").toLowerCase();
        };
        return {
            pluralize: pluralize,
            singularize: singularize,
            humanize: humanize,
            camelToTerms: camelToTerms,
            underscore: underscore,
            dasherize: dasherize
        };
    });
    //! src/utils/formatters/lpad.js
    define("lpad", function() {
        var lpad = function(str, char, len) {
            while (str.length < len) {
                str = char + str;
            }
            return str;
        };
        return lpad;
    });
    //! src/utils/formatters/removeExtraSpaces.js
    define("removeExtraSpaces", function() {
        var removeExtraSpaces = function(str) {
            str = str + "";
            return str.replace(/\s+/g, " ");
        };
        return removeExtraSpaces;
    });
    //! src/utils/ajax/http.js
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
            var response = this.responseText.trim();
            var start;
            var end;
            if (response) {
                start = response[0];
                end = response[response.length - 1];
            }
            if (response && (start === "{" && end === "}") || start === "[" && end === "]") {
                response = response ? JSON.parse(response.replace(/\/\*.*?\*\//g, "").replace(/\/\/[^\n\r]+/g, "")) : response;
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
                    var result = getRequestResult.call(this, that), self = this;
                    function onLoad() {
                        if (self.status >= 200 && self.status < 300) {
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
        function handleInterceptor(options) {
            return !!(result.intercept && result.intercept(options, Request));
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
                    if (handleInterceptor(options)) {
                        return;
                    }
                    return new Request(options).xhr;
                };
            })();
        }
        result.intercept = null;
        result.defaults = {
            headers: {}
        };
        return result;
    });
    //! src/utils/formatters/removeLineBreaks.js
    define("removeLineBreaks", function() {
        var removeLineBreaks = function(str) {
            str = str + "";
            return str.replace(/(\r\n|\n|\r)/gm, "");
        };
        return removeLineBreaks;
    });
    //! src/utils/formatters/rpad.js
    define("rpad", function() {
        var rpad = function(str, char, len) {
            while (str.length < len) {
                str += char;
            }
            return str;
        };
        return rpad;
    });
    //! src/utils/formatters/toBoolean.js
    define("toBoolean", function() {
        return function(val) {
            var type = typeof val;
            switch (type) {
              case "boolean":
                return val;

              case "string":
                if (val === "true") {
                    return true;
                }
                if (val === "false") {
                    return false;
                }
            }
            return !!val;
        };
    });
    //! src/utils/formatters/toDOM.js
    define("toDOM", function() {
        var htmlToDOM = function(htmlStr) {
            var container = document.createElement("div");
            container.innerHTML = htmlStr;
            return container.firstElementChild;
        };
        return htmlToDOM;
    });
    //! src/utils/formatters/toDateString.js
    define("toDateString", [ "isString", "isNumber", "isDate", "each" ], function(isString, isNumber, isDate, each) {
        var slice = [].slice, push = [].push;
        var DATETIME_FORMATS = {
            MONTH: "January,February,March,April,May,June,July,August,September,October,November,December".split(","),
            SHORTMONTH: "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(","),
            DAY: "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(","),
            SHORTDAY: "Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(","),
            AMPMS: [ "AM", "PM" ],
            medium: "MMM d, y h:mm:ss a",
            "short": "M/d/yy h:mm a",
            fullDate: "EEEE, MMMM d, y",
            longDate: "MMMM d, y",
            mediumDate: "MMM d, y",
            shortDate: "M/d/yy",
            mediumTime: "h:mm:ss a",
            shortTime: "h:mm a"
        };
        function int(val) {
            return parseInt(val, 10);
        }
        function uppercase(val) {
            return (val + "").toUpperCase();
        }
        function concat(array1, array2, index) {
            return array1.concat(slice.call(array2, index));
        }
        function padNumber(num, digits, trim) {
            var neg = "";
            if (num < 0) {
                neg = "-";
                num = -num;
            }
            num = "" + num;
            while (num.length < digits) {
                num = "0" + num;
            }
            if (trim) {
                num = num.substr(num.length - digits);
            }
            return neg + num;
        }
        function dateGetter(name, size, offset, trim) {
            offset = offset || 0;
            return function(date) {
                var value = date["get" + name]();
                if (offset > 0 || value > -offset) {
                    value += offset;
                }
                if (value === 0 && offset === -12) {
                    value = 12;
                }
                return padNumber(value, size, trim);
            };
        }
        function dateStrGetter(name, shortForm) {
            return function(date, formats) {
                var value = date["get" + name]();
                var get = uppercase(shortForm ? "SHORT" + name : name);
                return formats[get][value];
            };
        }
        function timeZoneGetter(date) {
            var zone = -1 * date.getTimezoneOffset();
            var paddedZone = zone >= 0 ? "+" : "";
            paddedZone += padNumber(Math[zone > 0 ? "floor" : "ceil"](zone / 60), 2) + padNumber(Math.abs(zone % 60), 2);
            return paddedZone;
        }
        function getFirstThursdayOfYear(year) {
            var dayOfWeekOnFirst = new Date(year, 0, 1).getDay();
            return new Date(year, 0, (dayOfWeekOnFirst <= 4 ? 5 : 12) - dayOfWeekOnFirst);
        }
        function getThursdayThisWeek(datetime) {
            return new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate() + (4 - datetime.getDay()));
        }
        function weekGetter(size) {
            return function(date) {
                var firstThurs = getFirstThursdayOfYear(date.getFullYear()), thisThurs = getThursdayThisWeek(date);
                var diff = +thisThurs - +firstThurs, result = 1 + Math.round(diff / 6048e5);
                return padNumber(result, size);
            };
        }
        function ampmGetter(date, formats) {
            return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1];
        }
        var DATE_FORMATS = {
            yyyy: dateGetter("FullYear", 4),
            yy: dateGetter("FullYear", 2, 0, true),
            y: dateGetter("FullYear", 1),
            MMMM: dateStrGetter("Month"),
            MMM: dateStrGetter("Month", true),
            MM: dateGetter("Month", 2, 1),
            M: dateGetter("Month", 1, 1),
            dd: dateGetter("Date", 2),
            d: dateGetter("Date", 1),
            HH: dateGetter("Hours", 2),
            H: dateGetter("Hours", 1),
            hh: dateGetter("Hours", 2, -12),
            h: dateGetter("Hours", 1, -12),
            mm: dateGetter("Minutes", 2),
            m: dateGetter("Minutes", 1),
            ss: dateGetter("Seconds", 2),
            s: dateGetter("Seconds", 1),
            sss: dateGetter("Milliseconds", 3),
            EEEE: dateStrGetter("Day"),
            EEE: dateStrGetter("Day", true),
            a: ampmGetter,
            Z: timeZoneGetter,
            ww: weekGetter(2),
            w: weekGetter(1)
        };
        var DATE_FORMATS_SPLIT = /((?:[^yMdHhmsaZEw']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z|w+))(.*)/, NUMBER_STRING = /^\-?\d+$/;
        var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
        function jsonStringToDate(string) {
            var match = string.match(R_ISO8601_STR);
            if (match) {
                var date = new Date(0), tzHour = 0, tzMin = 0, dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear, timeSetter = match[8] ? date.setUTCHours : date.setHours;
                if (match[9]) {
                    tzHour = int(match[9] + match[10]);
                    tzMin = int(match[9] + match[11]);
                }
                dateSetter.call(date, int(match[1]), int(match[2]) - 1, int(match[3]));
                var h = int(match[4] || 0) - tzHour;
                var m = int(match[5] || 0) - tzMin;
                var s = int(match[6] || 0);
                var ms = Math.round(parseFloat("0." + (match[7] || 0)) * 1e3);
                timeSetter.call(date, h, m, s, ms);
                return date;
            }
            return string;
        }
        var toDateString = function(date, format) {
            var text = "", parts = [], fn, match;
            format = format || "mediumDate";
            format = DATETIME_FORMATS[format] || format;
            if (isString(date)) {
                date = NUMBER_STRING.test(date) ? int(date) : jsonStringToDate(date);
            }
            if (isNumber(date)) {
                date = new Date(date);
            }
            if (!isDate(date)) {
                return date;
            }
            while (format) {
                match = DATE_FORMATS_SPLIT.exec(format);
                if (match) {
                    parts = concat(parts, match, 1);
                    format = parts.pop();
                } else {
                    parts.push(format);
                    format = null;
                }
            }
            each(parts, function(value) {
                fn = DATE_FORMATS[value];
                text += fn ? fn(date, DATETIME_FORMATS) : value.replace(/(^'|'$)/g, "").replace(/''/g, "'");
            });
            return text;
        };
        return toDateString;
    });
    //! src/utils/validators/isNumber.js
    define("isNumber", function() {
        var isNumber = function(val) {
            return typeof val === "number";
        };
        return isNumber;
    });
    //! src/utils/formatters/toObject.js
    define("toObject", [ "isUndefined", "isObject" ], function(isUndefined, isObject) {
        var toObject = function(value) {
            if (isUndefined(value)) {
                return {};
            }
            if (isObject(value)) {
                return value;
            }
            return {
                value: value
            };
        };
        return toObject;
    });
    //! src/utils/formatters/toString.js
    define("toString", function() {
        var toString = function() {
            var value = [];
            forEach(this, function(e) {
                value.push("" + e);
            });
            return "[" + value.join(", ") + "]";
        };
        return toString;
    });
    //! src/utils/formatters/toTimeAgo.js
    define("toTimeAgo", function() {
        var toTimeAgo = function(date) {
            var ago = " ago";
            var interval, seconds;
            seconds = Math.floor((new Date() - date) / 1e3);
            interval = Math.floor(seconds / 31536e3);
            if (interval >= 1) {
                return {
                    interval: interval,
                    ago: "y"
                };
            }
            interval = Math.floor(seconds / 2592e3);
            if (interval >= 1) {
                return {
                    interval: interval,
                    ago: "mo"
                };
            }
            interval = Math.floor(seconds / 86400);
            if (interval >= 1) {
                return {
                    interval: interval,
                    ago: "d"
                };
            }
            interval = Math.floor(seconds / 3600);
            if (interval >= 1) {
                return {
                    interval: interval,
                    ago: "h"
                };
            }
            interval = Math.floor(seconds / 60);
            if (interval >= 1) {
                return {
                    interval: interval,
                    ago: "m"
                };
            }
            interval = seconds < 0 ? 0 : Math.floor(seconds);
            if (interval <= 10) {
                return {
                    interval: interval,
                    ago: ""
                };
            }
            return {
                interval: interval,
                ago: "s"
            };
        };
        return toTimeAgo;
    });
    //! src/utils/formatters/toXML.js
    define("toXML", function() {
        var toXML = function(str) {
            var parser, xmlDoc;
            if (window.DOMParser) {
                parser = new DOMParser();
                xmlDoc = parser.parseFromString(str, "text/xml");
            } else {
                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = false;
                xmlDoc.loadXML(str);
            }
            return xmlDoc;
        };
        return toXML;
    });
    //! src/utils/formatters/toXMLString.js
    define("toXMLString", function() {
        var toXMLString = function(xmlObject) {
            var str;
            if (window.ActiveXObject) {
                str = xmlObject.xml;
            } else {
                str = new XMLSerializer().serializeToString(xmlObject);
            }
            str = str.replace(/\sxmlns=".*?"/gim, "");
            return str;
        };
        return toXMLString;
    });
    //! src/utils/geom/Rect.js
    define("rect", function() {
        var Rect = function(x, y, width, height) {
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
        return function(x, y, width, height) {
            return new Rect(x, y, width, height);
        };
    });
    //! src/utils/geom/degreesToRadians.js
    define("degreesToRadians", function() {
        return function degreesToRadians(deg) {
            return deg * (Math.PI / 180);
        };
    });
    //! src/utils/geom/getAngle.js
    define("getAngle", function() {
        return function getAngle(x1, y1, x2, y2) {
            return Math.atan2(y2 - y1, x2 - x1);
        };
    });
    //! src/utils/geom/getDistance.js
    define("getDistance", function() {
        return function getDistance(x1, y1, x2, y2) {
            return Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
        };
    });
    //! src/utils/geom/getPointOnCircle.js
    define("getPointOnCircle", function() {
        return function getPointOnCircle(cx, cy, r, a) {
            return {
                x: cx + r * Math.cos(a),
                y: cy + r * Math.sin(a)
            };
        };
    });
    //! src/utils/geom/radiansToDegrees.js
    define("radiansToDegrees", function() {
        return function radiansToDegrees(radians) {
            return radians * (180 / Math.PI);
        };
    });
    //! src/utils/localization/translate.js
    define("translate", function() {
        var isNumeric = function(obj) {
            return !isNaN(parseFloat(obj)) && isFinite(obj);
        };
        var isObject = function(obj) {
            return typeof obj === "object" && obj !== null;
        };
        var isString = function(obj) {
            return Object.prototype.toString.call(obj) === "[object String]";
        };
        return {
            create: function(messageObject, options) {
                options = isObject(options) ? options : {};
                var debug = options.debug;
                var namespaceSplitter = options.namespaceSplitter || "::";
                function getTranslationValue(translationKey) {
                    if (messageObject[translationKey]) {
                        return messageObject[translationKey];
                    }
                    var components = translationKey.split(namespaceSplitter);
                    var namespace = components[0];
                    var key = components[1];
                    if (messageObject[namespace] && messageObject[namespace][key]) {
                        return messageObject[namespace][key];
                    }
                    return null;
                }
                function getPluralValue(translation, count) {
                    if (isObject(translation)) {
                        if (Object.keys(translation).length === 0) {
                            debug && console.log("[Translation] No plural forms found.");
                            return null;
                        }
                        if (translation[count]) {
                            translation = translation[count];
                        } else if (translation.n) {
                            translation = translation.n;
                        } else {
                            debug && console.log('[Translation] No plural forms found for count:"' + count + '" in', translation);
                            translation = translation[Object.keys(translation).reverse()[0]];
                        }
                    }
                    return translation;
                }
                function replacePlaceholders(translation, replacements) {
                    if (isString(translation)) {
                        return translation.replace(/\{(\w*)\}/g, function(match, key) {
                            if (!replacements.hasOwnProperty(key)) {
                                debug && console.log('Could not find replacement "' + key + '" in provided replacements object:', replacements);
                                return "{" + key + "}";
                            }
                            return replacements.hasOwnProperty(key) ? replacements[key] : key;
                        });
                    }
                    return translation;
                }
                return function(translationKey) {
                    var replacements = isObject(arguments[1]) ? arguments[1] : isObject(arguments[2]) ? arguments[2] : {};
                    var count = isNumeric(arguments[1]) ? arguments[1] : isNumeric(arguments[2]) ? arguments[2] : null;
                    var translation = getTranslationValue(translationKey);
                    if (count !== null) {
                        replacements.n = replacements.n ? replacements.n : count;
                        translation = getPluralValue(translation, count);
                    }
                    translation = replacePlaceholders(translation, replacements);
                    if (translation === null) {
                        debug && console.log('Translation for "' + translationKey + '" not found.');
                        return "@@" + translationKey + "@@";
                    }
                    return translation;
                };
            }
        };
    });
    //! src/utils/parsers/functionName.js
    define("functionName", function() {
        return function(fn) {
            var f = typeof fn === "function";
            var s = f && (fn.name && [ "", fn.name ] || fn.toString().match(/function ([^\(]+)/));
            return !f && "not a function" || (s && s[1] || "anonymous");
        };
    });
    //! src/utils/parsers/htmlify.js
    define("htmlify", function() {
        function htmlify($text) {
            var tlnk = [];
            var hlnk = [];
            var ac, htm;
            $text = specialCharsToHtml($text);
            var i = 0;
            for (i = 0; i < 4; i++) {
                $text = $text.replace(/(\S+\.\S+)/, "<" + i + ">");
                tlnk[i] = RegExp.$1;
            }
            ac = i;
            for (i = 0; i < ac; i++) {
                if (tlnk[i].search(/\d\.\d/) > -1 || tlnk[i].length < 5) {
                    $text = $text.replace("<" + i + ">", tlnk[i]);
                } else {
                    htm = linkify(tlnk[i]);
                    $text = $text.replace("<" + i + ">", htm);
                }
            }
            $text = $text.replace(/\n/g, "<br/>");
            $text = $text.replace(/\ \ /g, " &nbsp;");
            $text = $text.replace(/"/g, "&quot;");
            $text = $text.replace(/\$/g, "&#36;");
            return $text;
        }
        function linkify(txt) {
            txt = htmlToSpecialChars(txt);
            var i = 0, pN, ch, prea, posta, turl, tlnk, hurl;
            pN = txt.length - 1;
            for (i = 0; i < pN; i++) {
                ch = txt.substr(i, 1);
                if (ch.search(/\w/) > -1) {
                    break;
                }
            }
            prea = txt.substring(0, i);
            prea = specialCharsToHtml(prea);
            txt = txt.substr(i);
            for (i = pN; i > 0; i--) {
                ch = txt.substr(i, 1);
                if (ch.search(/\w|_|-|\//) > -1) {
                    break;
                }
            }
            posta = txt.substring(i + 1);
            posta = specialCharsToHtml(posta);
            turl = txt.substring(0, i + 1);
            if (turl.search(/@/) > 0) {
                tlnk = '<a href="mailto:' + turl + '">' + turl + "</a>";
                return prea + tlnk + posta;
            }
            hurl = "";
            if (turl.search(/\w+:\/\//) < 0) {
                hurl = "http://";
            }
            tlnk = '<a href="' + hurl + turl + '">' + turl + "</a>";
            return prea + tlnk + posta;
        }
        function specialCharsToHtml(str) {
            str = str.replace(/&/g, "&amp;");
            str = str.replace(/</g, "&lt;");
            str = str.replace(/>/g, "&gt;");
            return str;
        }
        function htmlToSpecialChars(str) {
            str = str.replace(/&lt;/g, "<");
            str = str.replace(/&gt;/g, ">");
            str = str.replace(/&amp;/g, "&");
            return str;
        }
        return htmlify;
    });
    //! src/utils/parsers/interpolate.js
    define("interpolate", function() {
        var interpolate = function(scope, src) {
            var fn = Function;
            var result;
            try {
                result = new fn("return " + src).apply(scope);
                if (result + "" === "NaN") {
                    result = "";
                }
            } catch (e) {
                result = "";
            }
            return result;
        };
        return interpolate;
    });
    //! src/utils/parsers/urls.js
    define("urls", function() {
        var urls = function(str, type) {
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
        return urls;
    });
    //! src/utils/patterns/Singleton.js
    define("singleton", function() {
        var Singleton = function() {};
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
        return Singleton;
    });
    //! src/utils/patterns/command.js
    define("command", [ "dispatcher", "defer", "copy" ], function(dispatcher, defer, copy) {
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
            var deferred = defer(), commandComplete;
            deferred.__uid = CommandExecutor.counter += 1;
            if (typeof command === "function") {
                command = new command();
            } else {
                command = copy(command);
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
            dispatcher(this);
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
            dispatcher(this);
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
    });
    //! src/utils/patterns/injector.js
    define("injector", [ "isFunction", "toArray", "functionArgs" ], function(isFunction, toArray, functionArgs) {
        var string = "string", func = "function", proto = Injector.prototype;
        function functionOrArray(fn) {
            var f;
            if (fn instanceof Array) {
                fn = fn.concat();
                f = fn.pop();
                f.$inject = fn;
                fn = f;
            }
            return fn;
        }
        function construct(constructor, args) {
            function F() {
                return constructor.apply(this, args);
            }
            F.prototype = constructor.prototype;
            return new F();
        }
        function Injector() {
            this.registered = {};
            this.preProcessor = null;
        }
        proto.val = function(name, value) {
            var n = name.toLowerCase(), override;
            if (value !== undefined) {
                this.registered[n] = value;
            } else if (this.preProcessor) {
                override = this.preProcessor(name, this.registered[n]);
                if (override !== undefined) {
                    this.registered[n] = override;
                }
            }
            return this.registered[n];
        };
        proto.invoke = function(fn, scope, locals) {
            fn = functionOrArray(fn);
            return fn.apply(scope, this.prepareArgs(fn, locals, scope));
        };
        proto.instantiate = function(fn, locals) {
            fn = functionOrArray(fn);
            return construct(fn, this.prepareArgs(fn, locals));
        };
        proto.prepareArgs = function(fn, locals, scope) {
            if (!fn.$inject) {
                fn.$inject = functionArgs(fn);
            }
            var args = fn.$inject ? fn.$inject.slice() : [], i, len = args.length;
            for (i = 0; i < len; i += 1) {
                this.getInjection(args[i], i, args, locals, scope);
            }
            return args;
        };
        proto.getArgs = functionArgs;
        proto.getInjection = function(type, index, list, locals, scope) {
            var result, cacheValue;
            if (locals && locals[type]) {
                result = locals[type];
            } else if ((cacheValue = this.val(type)) !== undefined) {
                result = cacheValue;
            }
            if (result === undefined) {
                console.warn("Injection not found for " + type);
                throw new Error("Injection not found for " + type);
            }
            if (result instanceof Array && typeof result[0] === string && typeof result[result.length - 1] === func) {
                result = this.invoke(result.concat(), scope);
            }
            list[index] = result;
        };
        return function() {
            var injector = new Injector();
            if (arguments.length && isFunction(arguments[0])) {
                return injector.invoke.apply(injector, toArray(arguments));
            }
            return injector;
        };
    });
    //! src/utils/validators/isFunction.js
    define("isFunction", function() {
        var isFunction = function(val) {
            return typeof val === "function";
        };
        return isFunction;
    });
    //! src/utils/patterns/stateMachine.js
    define("stateMachine", function() {
        var StateMachine = {
            VERSION: "2.3.0",
            Result: {
                SUCCEEDED: 1,
                NOTRANSITION: 2,
                CANCELLED: 3,
                PENDING: 4
            },
            Error: {
                INVALID_TRANSITION: 100,
                PENDING_TRANSITION: 200,
                INVALID_CALLBACK: 300
            },
            WILDCARD: "*",
            ASYNC: "async",
            create: function(cfg, target) {
                var initial = typeof cfg.initial == "string" ? {
                    state: cfg.initial
                } : cfg.initial;
                var terminal = cfg.terminal || cfg["final"];
                var fsm = target || cfg.target || {};
                var events = cfg.events || [];
                var callbacks = cfg.callbacks || {};
                var map = {};
                var add = function(e) {
                    var from = e.from instanceof Array ? e.from : e.from ? [ e.from ] : [ StateMachine.WILDCARD ];
                    map[e.name] = map[e.name] || {};
                    for (var n = 0; n < from.length; n++) map[e.name][from[n]] = e.to || from[n];
                };
                if (initial) {
                    initial.event = initial.event || "startup";
                    add({
                        name: initial.event,
                        from: "none",
                        to: initial.state
                    });
                }
                for (var n = 0; n < events.length; n++) add(events[n]);
                for (var name in map) {
                    if (map.hasOwnProperty(name)) fsm[name] = StateMachine.buildEvent(name, map[name]);
                }
                for (var name in callbacks) {
                    if (callbacks.hasOwnProperty(name)) fsm[name] = callbacks[name];
                }
                fsm.current = "none";
                fsm.is = function(state) {
                    return state instanceof Array ? state.indexOf(this.current) >= 0 : this.current === state;
                };
                fsm.can = function(event) {
                    return !this.transition && (map[event].hasOwnProperty(this.current) || map[event].hasOwnProperty(StateMachine.WILDCARD));
                };
                fsm.cannot = function(event) {
                    return !this.can(event);
                };
                fsm.error = cfg.error || function(name, from, to, args, error, msg, e) {
                    throw e || msg;
                };
                fsm.isFinished = function() {
                    return this.is(terminal);
                };
                if (initial && !initial.defer) fsm[initial.event]();
                return fsm;
            },
            doCallback: function(fsm, func, name, from, to, args) {
                if (func) {
                    try {
                        return func.apply(fsm, [ name, from, to ].concat(args));
                    } catch (e) {
                        return fsm.error(name, from, to, args, StateMachine.Error.INVALID_CALLBACK, "an exception occurred in a caller-provided callback function", e);
                    }
                }
            },
            beforeAnyEvent: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onbeforeevent"], name, from, to, args);
            },
            afterAnyEvent: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onafterevent"] || fsm["onevent"], name, from, to, args);
            },
            leaveAnyState: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onleavestate"], name, from, to, args);
            },
            enterAnyState: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onenterstate"] || fsm["onstate"], name, from, to, args);
            },
            changeState: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onchangestate"], name, from, to, args);
            },
            beforeThisEvent: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onbefore" + name], name, from, to, args);
            },
            afterThisEvent: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onafter" + name] || fsm["on" + name], name, from, to, args);
            },
            leaveThisState: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onleave" + from], name, from, to, args);
            },
            enterThisState: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onenter" + to] || fsm["on" + to], name, from, to, args);
            },
            beforeEvent: function(fsm, name, from, to, args) {
                if (false === StateMachine.beforeThisEvent(fsm, name, from, to, args) || false === StateMachine.beforeAnyEvent(fsm, name, from, to, args)) return false;
            },
            afterEvent: function(fsm, name, from, to, args) {
                StateMachine.afterThisEvent(fsm, name, from, to, args);
                StateMachine.afterAnyEvent(fsm, name, from, to, args);
            },
            leaveState: function(fsm, name, from, to, args) {
                var specific = StateMachine.leaveThisState(fsm, name, from, to, args), general = StateMachine.leaveAnyState(fsm, name, from, to, args);
                if (false === specific || false === general) return false; else if (StateMachine.ASYNC === specific || StateMachine.ASYNC === general) return StateMachine.ASYNC;
            },
            enterState: function(fsm, name, from, to, args) {
                StateMachine.enterThisState(fsm, name, from, to, args);
                StateMachine.enterAnyState(fsm, name, from, to, args);
            },
            buildEvent: function(name, map) {
                return function() {
                    var from = this.current;
                    var to = map[from] || map[StateMachine.WILDCARD] || from;
                    var args = Array.prototype.slice.call(arguments);
                    if (this.transition) return this.error(name, from, to, args, StateMachine.Error.PENDING_TRANSITION, "event " + name + " inappropriate because previous transition did not complete");
                    if (this.cannot(name)) return this.error(name, from, to, args, StateMachine.Error.INVALID_TRANSITION, "event " + name + " inappropriate in current state " + this.current);
                    if (false === StateMachine.beforeEvent(this, name, from, to, args)) return StateMachine.Result.CANCELLED;
                    if (from === to) {
                        StateMachine.afterEvent(this, name, from, to, args);
                        return StateMachine.Result.NOTRANSITION;
                    }
                    var fsm = this;
                    this.transition = function() {
                        fsm.transition = null;
                        fsm.current = to;
                        StateMachine.enterState(fsm, name, from, to, args);
                        StateMachine.changeState(fsm, name, from, to, args);
                        StateMachine.afterEvent(fsm, name, from, to, args);
                        return StateMachine.Result.SUCCEEDED;
                    };
                    this.transition.cancel = function() {
                        fsm.transition = null;
                        StateMachine.afterEvent(fsm, name, from, to, args);
                    };
                    var leave = StateMachine.leaveState(this, name, from, to, args);
                    if (false === leave) {
                        this.transition = null;
                        return StateMachine.Result.CANCELLED;
                    } else if (StateMachine.ASYNC === leave) {
                        return StateMachine.Result.PENDING;
                    } else {
                        if (this.transition) return this.transition();
                    }
                };
            }
        };
        return function(options, target) {
            return StateMachine.create(options, target);
        };
    });
    //! src/utils/polyfills/array.indexOf.js
    internal("array.indexOf", function() {
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
        return true;
    });
    //! src/utils/polyfills/date.toISOString.js
    internal("date.toISOString", function() {
        if (!Date.prototype.toISOString) {
            function pad(number) {
                if (number < 10) {
                    return "0" + number;
                }
                return number;
            }
            Date.prototype.toISOString = function() {
                return this.getUTCFullYear() + "-" + pad(this.getUTCMonth() + 1) + "-" + pad(this.getUTCDate()) + "T" + pad(this.getUTCHours()) + ":" + pad(this.getUTCMinutes()) + ":" + pad(this.getUTCSeconds()) + "." + (this.getUTCMilliseconds() / 1e3).toFixed(3).slice(2, 5) + "Z";
            };
        }
        return true;
    });
    //! src/utils/polyfills/string.supplant.js
    //! pattern /\.supplant\(/
    internal("string.supplant", function() {
        if (!String.prototype.supplant) {
            String.prototype.supplant = function(o) {
                return this.replace(/{([^{}]*)}/g, function(a, b) {
                    var r = o[b];
                    return typeof r === "string" || typeof r === "number" ? r : a;
                });
            };
        }
        return true;
    });
    //! src/utils/polyfills/string.trim.js
    internal("string.trim", [ "isString" ], function(isString) {
        if (!String.prototype.trim) {
            return function(value) {
                return isString(value) ? value.replace(/^\s\s*/, "").replace(/\s\s*$/, "") : value;
            };
        }
        return true;
    });
    //! src/utils/polyfills/window.console.js
    internal("window.console", function() {
        if (!("console" in window)) {
            window.console = {
                isOverride: true,
                log: function() {},
                warn: function() {},
                info: function() {},
                error: function() {}
            };
        }
        return true;
    });
    //! src/utils/query/event/bind.js
    internal("query.bind", [ "query" ], function(query) {
        query.fn.bind = query.fn.on = function(events, handler) {
            events = events.match(/\w+/gim);
            var i = 0, event, len = events.length;
            while (i < len) {
                event = events[i];
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
                i += 1;
            }
            return this;
        };
    });
    //! src/utils/query/focus/focus.js
    //! pattern /("|')query\1/
    internal("query.focus", [ "query" ], function(query) {
        query.fn.focus = function(val) {
            this.each(function(index, el) {
                el.focus();
            });
            return this;
        };
    });
    //! src/utils/query/focus/select.js
    //! pattern /("|')query\1/
    //! import query.val
    internal("query.cursor", [ "query" ], function(query) {
        query.fn.getCursorPosition = function() {
            if (this.length === 0) {
                return -1;
            }
            return query(this).getSelectionStart();
        };
        query.fn.setCursorPosition = function(position) {
            if (this.length === 0) {
                return this;
            }
            return query(this).setSelection(position, position);
        };
        query.fn.getSelection = function() {
            if (this.length === 0) {
                return -1;
            }
            var s = query(this).getSelectionStart();
            var e = query(this).getSelectionEnd();
            return this[0].value.substring(s, e);
        };
        query.fn.getSelectionStart = function() {
            if (this.length === 0) {
                return -1;
            }
            var input = this[0];
            var pos = input.value.length;
            if (input.createTextRange) {
                var r = document.selection.createRange().duplicate();
                r.moveEnd("character", input.value.length);
                if (r.text === "") {
                    pos = input.value.length;
                }
                pos = input.value.lastIndexOf(r.text);
            } else if (typeof input.selectionStart !== "undefined") {
                pos = input.selectionStart;
            }
            return pos;
        };
        query.fn.getSelectionEnd = function() {
            if (this.length === 0) {
                return -1;
            }
            var input = this[0];
            var pos = input.value.length;
            if (input.createTextRange) {
                var r = document.selection.createRange().duplicate();
                r.moveStart("character", -input.value.length);
                if (r.text === "") {
                    pos = input.value.length;
                }
                pos = input.value.lastIndexOf(r.text);
            } else if (typeof input.selectionEnd !== "undefined") {}
            return pos;
        };
        query.fn.setSelection = function(selectionStart, selectionEnd) {
            if (this.length === 0) {
                return this;
            }
            var input = this[0];
            if (input.createTextRange) {
                var range = input.createTextRange();
                range.collapse(true);
                range.moveEnd("character", selectionEnd);
                range.moveStart("character", selectionStart);
                range.select();
            } else if (input.setSelectionRange) {
                input.setSelectionRange(selectionStart, selectionEnd);
            }
            return this;
        };
        query.fn.setSelectionRange = function(range) {
            var element = query(this);
            switch (range) {
              case "start":
                element.setSelection(0, 0);
                break;

              case "end":
                element.setSelection(element.val().length, element.val().length);
                break;

              case true:
              case "all":
                element.setSelection(0, element.val().length);
                break;
            }
        };
        query.fn.select = function() {
            this.setSelectionRange(true);
        };
    });
    //! src/utils/query/modify/val.js
    internal("query.val", [ "query" ], function(query) {
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
    });
    //! src/utils/query/query.js
    define("query", function() {
        function Query(selector, context) {
            this.init(selector, context);
        }
        var queryPrototype = Query.prototype = Object.create(Array.prototype);
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
        var query = function(selector, context) {
            for (var n in query.fn) {
                if (query.fn.hasOwnProperty(n)) {
                    queryPrototype[n] = query.fn[n];
                    delete query.fn[n];
                }
            }
            return new Query(selector, context);
        };
        query.fn = {};
        return query;
    });
    //! src/utils/query/event/change.js
    //! import query.trigger
    internal("query.change", [ "query", "isDefined" ], function(query, isDefined) {
        query.fn.change = function(handler) {
            var scope = this;
            if (isDefined(handler)) {
                scope.on("change", handler);
            } else {
                scope.trigger("change");
            }
            return scope;
        };
    });
    //! src/utils/query/event/trigger.js
    internal("query.trigger", [ "query" ], function(query) {
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
    });
    //! src/utils/validators/isDefined.js
    define("isDefined", function() {
        var isDefined = function(val) {
            return typeof val !== "undefined";
        };
        return isDefined;
    });
    //! src/utils/query/event/click.js
    //! import query.trigger
    internal("query.click", [ "query", "isDefined" ], function(query, isDefined) {
        query.fn.click = function(handler) {
            var scope = this;
            if (isDefined(handler)) {
                scope.bind("click", handler);
            } else {
                scope.trigger("click");
            }
            return scope;
        };
    });
    //! src/utils/query/event/unbind.js
    internal("query.unbind", [ "query" ], function(query) {
        query.fn.unbind = query.fn.off = function(events, handler) {
            if (arguments.length === 1) {
                this.unbindAll(events);
            } else {
                events = events.match(/\w+/gim);
                var i = 0, event, len = events.length;
                while (i < len) {
                    event = events[i];
                    this.each(function(index, el) {
                        if (el.detachEvent) {
                            el.detachEvent("on" + event, el[event + handler]);
                            el[event + handler] = null;
                        } else {
                            el.removeEventListener(event, handler, false);
                        }
                    });
                    i += 1;
                }
            }
            return this;
        };
    });
    //! src/utils/query/event/unbindAll.js
    internal("query.unbindAll", [ "query" ], function(query) {
        query.fn.unbindAll = function(event) {
            var scope = this;
            scope.each(function(index, el) {
                if (el.eventHolder) {
                    var removed = 0, handler;
                    for (var i = 0; i < el.eventHolder.length; i++) {
                        if (!event || el.eventHolder[i][0] === event) {
                            event = el.eventHolder[i][0];
                            handler = el.eventHolder[i][1];
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
            return scope;
        };
    });
    //! src/utils/query/measure/height.js
    //! import query.css
    internal("query.height", [ "query" ], function(query) {
        query.fn.height = function(val) {
            return this.css("height", val);
        };
    });
    //! src/utils/query/modify/css.js
    internal("query.css", [ "query" ], function(query) {
        query.fn.css = function(prop, value) {
            var el, returnValue, i, len;
            if (this.length) {
                el = this[0];
                if (arguments.length > 1) {
                    this.each(function(index, el) {
                        el.style[prop] = value;
                    });
                } else if (arguments.length === 1 && typeof prop === "object") {
                    for (i in prop) {
                        if (prop.hasOwnProperty(i)) {
                            el.style[i] = prop[i];
                        }
                    }
                }
                if (prop instanceof Array) {
                    i = 0;
                    len = prop.length;
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
                } else if (typeof prop === "object") {
                    returnValue = {};
                    if (el.currentStyle) {
                        for (i in prop) {
                            if (prop.hasOwnProperty(i)) {
                                returnValue[prop[i]] = el.currentStyle[prop[i]];
                            }
                        }
                    } else if (window.getComputedStyle) {
                        for (i in prop) {
                            if (prop.hasOwnProperty(i)) {
                                returnValue[prop[i]] = document.defaultView.getComputedStyle(el, null).getPropertyValue(prop[i]);
                            }
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
    });
    //! src/utils/query/measure/innerHeight.js
    //! import query.css
    internal("query.innerHeight", [ "query" ], function(query) {
        query.fn.innerHeight = function() {
            return this.css("innerHeight");
        };
    });
    //! src/utils/query/measure/innerWidth.js
    //! import query.css
    internal("query.innerWidth", [ "query" ], function(query) {
        query.fn.innerWidth = function() {
            return this.css("innerWidth");
        };
    });
    //! src/utils/query/measure/offset.js
    internal("query.offset", [ "query" ], function(query) {
        query.fn.offset = function() {
            if (this.length) {
                return this[0].getBoundingClientRect();
            }
        };
    });
    //! src/utils/query/measure/outerHeight.js
    //! import query.css
    internal("query.outerHeight", [ "query" ], function(query) {
        query.fn.outerHeight = function() {
            return this.css("outerHeight");
        };
    });
    //! src/utils/query/measure/outerWidth.js
    //! import query.css
    internal("query.outerWidth", [ "query" ], function(query) {
        query.fn.outerWidth = function() {
            return this.css("outerWidth");
        };
    });
    //! src/utils/query/measure/width.js
    //! import query.css
    internal("query.width", [ "query" ], function(query) {
        query.fn.width = function(val) {
            return this.css("width", val);
        };
    });
    //! src/utils/query/modify/addClass.js
    internal("query.addClass", [ "query" ], function(query) {
        query.fn.addClass = function(className) {
            var $el;
            this.each(function(index, el) {
                $el = query(el);
                if (!$el.hasClass(className)) {
                    el.className += " " + className;
                }
            });
            return this;
        };
    });
    //! src/utils/query/modify/hasClass.js
    internal("query.hasClass", [ "query" ], function(query) {
        query.fn.hasClass = function(className) {
            var returnVal = false;
            this.each(function(index, el) {
                if (!returnVal) {
                    if (el.classList) {
                        returnVal = el.classList.contains(className);
                    } else {
                        returnVal = new RegExp("(^| )" + className + "( |$)", "gi").test(el.className);
                    }
                    if (returnVal) {
                        return false;
                    }
                }
            });
            return returnVal;
        };
    });
    //! src/utils/query/modify/attr.js
    internal("query.attr", [ "query" ], function(query) {
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
    });
    //! src/utils/query/modify/prop.js
    internal("query.prop", [ "query" ], function(query) {
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
    });
    //! src/utils/query/modify/removeClass.js
    internal("query.removeClass", [ "query", "isDefined" ], function(query, isDefined) {
        query.fn.removeClass = function(className) {
            var $el;
            this.each(function(index, el) {
                $el = query(el);
                if (isDefined(className)) {
                    var newClass = " " + el.className.replace(/[\t\r\n]/g, " ") + " ";
                    if ($el.hasClass(className)) {
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
    });
    //! src/utils/query/mutate/replace.js
    //! pattern /(\w+|\))\.replace\(/
    //! pattern /("|')query\1/
    internal("query.replace", [ "query" ], function(query) {
        query.fn.replace = function(val) {
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
    });
    //! src/utils/query/modify/toggleClass.js
    internal("query.toggleClass", [ "query" ], function(query) {
        query.fn.toggleClass = function(className, on) {
            var classes = className.split(" ");
            var $el;
            this.each(function(index, el) {
                $el = query(el);
                for (var e in classes) {
                    className = classes[e];
                    if ($el.hasClass(className) && !on) {
                        $el.removeClass(className);
                    } else if (on || on === undefined) {
                        $el.addClass(className);
                    }
                }
            });
            return this;
        };
    });
    //! src/utils/query/mutate/after.js
    //! pattern /(\w+|\))\.after\(/
    //! pattern /("|')query\1/
    internal("query.after", [ "query" ], function(query) {
        query.fn.after = function(val) {
            var parentNode, i;
            if (typeof val === "string") {
                val = query(val);
            }
            var newEl, els = [];
            this.each(function(index, el) {
                parentNode = el.parentNode;
                i = val.length;
                while (i--) {
                    el.insertAdjacentHTML("afterEnd", val[i].outerHTML);
                    els.push(el.nextElementSibling);
                }
            });
            return els;
        };
    });
    //! src/utils/query/mutate/append.js
    //! pattern /(\w+|\))\.append\(/
    //! pattern /("|')query\1/
    internal("query.append", [ "query" ], function(query) {
        query.fn.append = function(val) {
            var parentNode, i, len;
            if (typeof val === "string") {
                val = query(val);
            }
            var els = [];
            this.each(function(index, el) {
                parentNode = el.parentNode;
                i = 0;
                len = val.length;
                while (i < len) {
                    el.insertAdjacentHTML("beforeEnd", val[i].outerHTML);
                    els.push(el.lastElementChild);
                    i += 1;
                }
            });
            return els;
        };
    });
    //! src/utils/query/mutate/before.js
    //! pattern /(\w+|\))\.before\(/
    //! pattern /("|')query\1/
    internal("query.before", [ "query" ], function(query) {
        query.fn.before = function(val) {
            var parentNode, i, len;
            if (typeof val === "string") {
                val = query(val);
            }
            var els = [];
            this.each(function(index, el) {
                parentNode = el.parentNode;
                i = 0;
                len = val.length;
                while (i < len) {
                    el.insertAdjacentHTML("beforeBegin", val[i].outerHTML);
                    els.push(el.previousElementSibling);
                    i += 1;
                }
            });
            return els;
        };
    });
    //! src/utils/query/mutate/empty.js
    //! pattern /(\w+|\))\.empty\(/
    //! pattern /("|')query\1/
    internal("query.empty", [ "query" ], function(query) {
        query.fn.empty = function() {
            this.each(function(index, el) {
                el.innerHTML = null;
            });
        };
    });
    //! src/utils/query/mutate/html.js
    //! pattern /(\w+|\))\.html\(/
    //! pattern /("|')query\1/
    internal("query.html", [ "query" ], function(query) {
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
    });
    //! src/utils/query/mutate/prepend.js
    //! pattern /(\w+|\))\.prepend\(/
    //! pattern /("|')query\1/
    internal("query.prepend", [ "query" ], function(query) {
        query.fn.prepend = function(elements) {
            var i, len;
            if (typeof elements === "string") {
                elements = query(elements);
            }
            var newEl, els = [];
            this.each(function(index, el) {
                i = elements.length;
                while (i--) {
                    el.insertAdjacentHTML("afterBegin", elements[i].outerHTML);
                    els.push(el.firstElementChild);
                }
            });
            return els;
        };
    });
    //! src/utils/query/mutate/remove.js
    //! pattern /(\w+|\))\.remove\(/
    //! pattern /("|')query\1/
    internal("query.remove", [ "query" ], function(query) {
        query.fn.remove = function() {
            this.each(function(index, el) {
                if (el.parentElement) {
                    el.parentElement.removeChild(el);
                }
            });
        };
    });
    //! src/utils/query/mutate/text.js
    //! pattern /(\w+|\))\.text\(/
    //! pattern /("|')query\1/
    internal("query.text", [ "query" ], function(query) {
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
    });
    //! src/utils/query/queryBuilder.js
    define("queryBuilder", function() {
        var omitAttrs, uniqueAttrs, classFilters, classFiltersFctn, queryBuilder;
        function query(selectorStr, el) {
            el = el || queryBuilder.config.doc.body;
            var rx = /:eq\((\d+)\)$/, match = selectorStr.match(rx), result, count;
            if (match && match.length) {
                selectorStr = selectorStr.replace(rx, "");
                count = match[1];
            }
            result = el.querySelectorAll(selectorStr);
            if (result && count !== undefined) {
                return result[count];
            }
            return result;
        }
        function getCleanSelector(el, ignoreClass) {
            el = validateEl(el);
            if (el) {
                var ignore = buildIgnoreFunction(ignoreClass), matches, index, str, maxParent = queryBuilder.config.doc.body, selector = getSelectorData(el, maxParent, ignore, null, true);
                while (selector.count > selector.totalCount) {
                    selector = selector.parent;
                }
                selector = selector.parent || selector;
                str = selector.str || selectorToString(selector);
                if (selector.str) {
                    var child = selector.child;
                    while (child) {
                        str += " " + child.str;
                        child = child.child;
                    }
                }
                if (selector.count > 1 || selector.child && selector.child.count) {
                    matches = Array.prototype.slice.apply(query(str, maxParent));
                    index = matches.indexOf(el);
                    str += ":eq(" + index + ")";
                }
                str += getVisible();
                return str;
            }
            return "";
        }
        function quickSelector(element, maxParent, ignoreClass) {
            element = validateEl(element);
            if (element) {
                var ignore = buildIgnoreFunction(ignoreClass), selector = getSelectorData(element, maxParent, ignore);
                return selectorToString(selector) + getVisible();
            }
            return "";
        }
        function validateEl(el) {
            return el;
        }
        function getVisible() {
            return queryBuilder.config.addVisible ? ":visible" : "";
        }
        function matchesClass(item, matcher) {
            if (typeof matcher === "string" && matcher === item) {
                return true;
            }
            if (typeof matcher === "object" && item.match(matcher)) {
                return true;
            }
            return false;
        }
        function getSelectorData(element, maxParent, ignoreClass, child, smartSelector) {
            var result;
            if (!element) {
                return "";
            }
            maxParent = maxParent || queryBuilder.config.doc;
            result = {
                element: element,
                ignoreClass: ignoreClass,
                maxParent: maxParent,
                classes: getClasses(element, ignoreClass),
                attributes: getAttributes(element, child),
                type: element.nodeName && element.nodeName.toLowerCase() || "",
                child: child
            };
            if (!result.attributes.$unique || child) {
                if (smartSelector) {
                    result.str = selectorToString(result, 0, null, true);
                    result.count = maxParent.querySelectorAll(result.str).length;
                    if (result.count > 1) {
                        result.parent = getParentSelector(element, maxParent, ignoreClass, result, smartSelector);
                    }
                } else {
                    result.parent = getParentSelector(element, maxParent, ignoreClass, result, smartSelector);
                }
            }
            return result;
        }
        function filterNumbers(item) {
            return typeof item !== "number";
        }
        function buildIgnoreFunction(ignoreClasses) {
            ignoreClasses = ignoreClasses || [];
            if (typeof ignoreClasses === "function") {
                return ignoreClasses;
            }
            return function(cls) {
                if (ignoreClasses instanceof Array) {
                    var i = 0, iLen = ignoreClasses.length;
                    while (i < iLen) {
                        if (matchesClass(cls, ignoreClasses[i])) {
                            return false;
                        }
                        i += 1;
                    }
                } else if (matchesClass(cls, ignoreClasses)) {
                    return false;
                }
                return true;
            };
        }
        function getClasses(element, ignoreClass) {
            var classes = data.filter(element.classList, filterNumbers);
            classes = data.filter(classes, classFiltersFctn);
            return data.filter(classes, ignoreClass);
        }
        function getAttributes(element, child) {
            var i = 0, len = element.attributes ? element.attributes.length : 0, attr, attributes = [], uniqueAttr = getUniqueAttribute(element.attributes);
            if (uniqueAttr) {
                if (uniqueAttr.name === "id" && queryBuilder.config.allowId) {
                    attributes.push("#" + uniqueAttr.value);
                } else if (uniqueAttr.name !== "id") {
                    attributes.push(createAttrStr(uniqueAttr));
                }
                if (attributes.length) {
                    attributes.$unique = true;
                    return attributes;
                }
            }
            if (queryBuilder.config.allowAttributes) {
                while (i < len) {
                    attr = element.attributes[i];
                    if (!omitAttrs[attr.name] && !uniqueAttrs[attr.name]) {
                        attributes.push(createAttrStr(attr));
                    }
                    i += 1;
                }
            }
            return attributes;
        }
        function createAttrStr(attr) {
            return "[" + camelCase(attr.name) + "='" + escapeQuotes(attr.value) + "']";
        }
        function getUniqueAttribute(attributes) {
            var attr, i = 0, len = attributes ? attributes.length : 0, name;
            while (i < len) {
                attr = attributes[i];
                name = camelCase(attr.name);
                if (uniqueAttrs[name]) {
                    return attr;
                }
                i += 1;
            }
            return null;
        }
        function camelCase(name) {
            var ary, i = 1, len;
            if (name.indexOf("-")) {
                ary = name.split("-");
                len = ary.length;
                while (i < len) {
                    ary[i] = ary[i].charAt(0).toUpperCase() + ary[i].substr(1);
                    i += 1;
                }
                name = ary.join("");
            }
            return name;
        }
        function escapeQuotes(str) {
            return str.replace(/"/g, "&quot;").replace(/'/g, "&apos;");
        }
        function selectorToString(selector, depth, overrideMaxParent, skipCount) {
            var matches, str, parent;
            depth = depth || 0;
            str = selector && !selector.attributes.$unique ? selectorToString(selector.parent, depth + 1) : "";
            if (selector) {
                str += (str.length ? " " : "") + getSelectorString(selector);
            }
            if (!depth && !skipCount) {
                parent = overrideMaxParent || selector.maxParent;
                matches = parent.querySelectorAll && parent.querySelectorAll(str) || [];
                if (matches.length > 1) {
                    str += ":eq(" + getIndexOfTarget(matches, selector.element) + ")";
                }
            }
            return str;
        }
        function getSelectorString(selector) {
            if (selector.attributes.$unique) {
                return selector.attributes[0];
            }
            return selector.type + selector.attributes.join("") + (selector.classes.length ? "." + selector.classes.join(".") : "");
        }
        function getParentSelector(element, maxParent, ignoreClass, child, detailed) {
            var parent = element.parentNode;
            if (parent && parent !== maxParent) {
                return getSelectorData(element.parentNode, maxParent, ignoreClass, child, detailed);
            }
            return null;
        }
        function getIndexOfTarget(list, element) {
            var i, iLen = list.length;
            for (i = 0; i < iLen; i += 1) {
                if (element === list[i]) {
                    return i;
                }
            }
            return -1;
        }
        function getList(obj) {
            var ary = [], i;
            for (i in obj) {
                if (obj.hasOwnProperty(i)) {
                    ary.push(obj[i]);
                }
            }
            return ary;
        }
        queryBuilder = {
            config: {
                doc: window.document,
                allowId: true,
                allowAttributes: true,
                addVisible: false
            },
            addOmitAttrs: function(name) {
                each(arguments, function(name) {
                    omitAttrs[name] = true;
                });
                return this;
            },
            removeOmitAttrs: function(name) {
                each(arguments, function(name) {
                    delete omitAttrs[name];
                });
                return this;
            },
            getOmitAttrs: function() {
                return getList(omitAttrs);
            },
            resetOmitAttrs: function() {
                omitAttrs = {
                    "class": true,
                    style: true
                };
            },
            addUniqueAttrs: function(name) {
                each(arguments, function(name) {
                    uniqueAttrs[name] = true;
                });
                return this;
            },
            removeUniqueAttrs: function(name) {
                each(arguments, function(name) {
                    delete uniqueAttrs[name];
                });
                return this;
            },
            getUniqueAttrs: function() {
                return getList(uniqueAttrs);
            },
            resetUniqueAttrs: function() {
                uniqueAttrs = {
                    id: true,
                    uid: true
                };
            },
            addClassOmitFilters: function() {
                each(arguments, function(filter) {
                    classFilters.push(filter);
                });
                classFiltersFctn = buildIgnoreFunction(classFilters);
                return this;
            },
            removeClassOmitFilters: function() {
                each(arguments, function(filter) {
                    var index = classFilters.indexOf(filter);
                    if (index !== -1) {
                        classFilters.splice(index, 1);
                    }
                });
                classFiltersFctn = buildIgnoreFunction(classFilters);
                return this;
            },
            getClassOmitFilters: function() {
                return classFilters.slice(0);
            },
            resetClassOmitFilters: function() {
                classFilters = [];
                classFiltersFctn = buildIgnoreFunction(classFilters);
            },
            query: query,
            get: getCleanSelector,
            getCleanSelector: getCleanSelector,
            quickSelector: quickSelector,
            reset: function() {
                queryBuilder.resetOmitAttrs();
                queryBuilder.resetUniqueAttrs();
                queryBuilder.resetClassOmitFilters();
            }
        };
        queryBuilder.reset();
        return queryBuilder;
    });
    //! src/utils/query/select/children.js
    //! pattern /(\w+|\))\.children\(/
    //! pattern /("|')query\1/
    internal("query.children", [ "query" ], function(query) {
        query.fn.children = function() {
            var list = [], i, len;
            this.each(function(index, el) {
                list = list.concat(el.childNodes);
                var nodes = el.childNodes;
                i = 0;
                len = nodes.length;
                while (i < len) {
                    list.push(nodes[i]);
                    i += 1;
                }
            });
            return query(list);
        };
    });
    //! src/utils/query/select/find.js
    //! pattern /(\w+|\))\.find\(/
    //! pattern /("|')query\1/
    internal("query.find", [ "query" ], function(query) {
        query.fn.find = function(selector) {
            if (this.length) {
                return query(selector, this[0]);
            }
            return query();
        };
    });
    //! src/utils/query/select/first.js
    //! pattern /(\w+|\))\.first\(/
    //! pattern /("|')query\1/
    internal("query.first", [ "query" ], function(query) {
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
    });
    //! src/utils/query/select/get.js
    //! pattern /(\w+|\))\.get\(/
    //! pattern /("|')query\1/
    internal("query.get", [ "query", "isDefined" ], function(query, isDefined) {
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
    });
    //! src/utils/query/select/last.js
    //! pattern /(\w+|\))\.last\(/
    //! pattern /("|')query\1/
    internal("query.last", [ "query" ], function(query) {
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
    });
    //! src/utils/query/select/next.js
    //! pattern /(\w+|\))\.next\(/
    //! pattern /("|')query\1/
    internal("query.next", [ "query" ], function(query) {
        query.fn.next = function() {
            var list = [], i, len;
            this.each(function(index, el) {
                list = list.concat(el.childNodes);
                var node = el.nextElementSibling;
                if (node) {
                    list.push(node);
                }
            });
            return query(list);
        };
    });
    //! src/utils/query/select/not.js
    //! pattern /(\w+|\))\.not\(/
    //! pattern /("|')query\1/
    internal("query.not", [ "query" ], function(query) {
        query.fn.not = function(selector) {
            if (this.length) {
                return query(":not(" + selector + ")", this[0]);
            }
            return query();
        };
    });
    //! src/utils/query/select/parent.js
    //! pattern /(\w+|\))\.parent\(/
    //! pattern /("|')query\1/
    internal("query.parent", [ "query" ], function(query) {
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
    });
    //! src/utils/query/select/prev.js
    //! pattern /(\w+|\))\.prev\(/
    //! pattern /("|')query\1/
    internal("query.prev", [ "query" ], function(query) {
        query.fn.prev = function() {
            var list = [];
            this.each(function(index, el) {
                list = list.concat(el.childNodes);
                var node = el.previousElementSibling;
                if (node) {
                    list.push(node);
                }
            });
            return query(list);
        };
    });
    //! src/utils/query/validators/isChecked.js
    //! pattern /(\w+|\))\.isChecked\(/
    //! pattern /("|')query\1/
    internal("query.isChecked", [ "query" ], function(query) {
        query.fn.isChecked = function() {
            if (this.length) {
                return this[0].checked;
            }
            return false;
        };
    });
    //! src/utils/query/validators/isVisible.js
    //! pattern /(\w+|\))\.isVisible\(/
    //! pattern /("|')query\1/
    internal("query.isVisible", [ "query" ], function(query) {
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
    });
    //! src/utils/reports/benchmark.js
    internal("benchmark", [ "shades", "rpad", "functionName" ], function(shades, rpad, functionName) {
        function LogItem(key, type, time, message) {
            var api = {};
            function toString() {
                if (api.type === "start") {
                    return "[" + api.key + "] (start:" + api.time + ") " + api.message;
                }
                return "[" + api.key + "] (start:" + api.startTime + " end:" + api.endTime + " difference:" + api.diff() + ") " + api.message;
            }
            function diff() {
                if (api._diff < 0 && api.endTime > 0) {
                    api._diff = api.endTime - api.startTime;
                }
                return api._diff;
            }
            api.startTime = -1;
            api.endTime = -1;
            api.key = key;
            api.type = type;
            api.time = time;
            api.message = message;
            api.diff = diff;
            api._diff = -1;
            api.toString = toString;
            return api;
        }
        function ReportItem(item) {
            this.key = item.key;
            this.message = item.message;
            this.items = [];
        }
        ReportItem.prototype = {
            key: null,
            message: null,
            items: null,
            totalTime: 0,
            max: 0,
            average: 0,
            addItem: function(item) {
                var diff = item.diff();
                this.items.push(item);
                this.max = diff > this.max ? diff : this.max;
                this.totalTime += diff;
                this.average = this.totalTime / this.count();
            },
            count: function() {
                return this.items.length;
            }
        };
        function renderer(data) {
            var item, i, j, len, jLen = data[0] && data[0].color.length;
            for (i = 0, len = data.length; i < len; i += 1) {
                item = data[i];
                console.log(item.name);
                for (j = 0; j < jLen; j += 1) {
                    console.log("	%c" + rpad("", " ", data[i].value[j] / 100), "font-size:10px;line-height:10px;width:10px;background:" + item.color[j] + ";", "	" + item.label[j], "	" + item.value[j]);
                }
            }
        }
        function Benchmark() {
            this.renderer = renderer;
            this.init();
        }
        Benchmark.prototype = {
            enable: true,
            START: "start",
            STOP: "stop",
            _logs: null,
            _stared: null,
            _reports: null,
            _reportsList: null,
            _chartData: null,
            _chartDataLength: 0,
            _paused: false,
            threshold: null,
            hide: null,
            init: function() {
                this.filter = "";
                this.threshold = {
                    count: 0,
                    totalTime: 0,
                    average: 0,
                    max: 0,
                    maxLength: 10,
                    warnTime: 100
                };
                this.clear();
            },
            clear: function() {
                this._logs = [];
                this._started = {};
                this._reports = {};
                this._reportsList = [];
                this._chartData = this.createChartData();
                this.hide = {};
            },
            start: function(key, message) {
                if (!this.enable) {
                    return;
                }
                var time = performance.now(), item;
                if (this._started[key]) {
                    this.stop(key, message);
                }
                item = new LogItem(key, this.START, time, message);
                this._started[key] = item;
                this._logs.push(item);
            },
            stop: function(key) {
                if (!this.enable) {
                    return;
                }
                var time = performance.now(), start = this._started[key];
                if (start) {
                    start.startTime = start.time;
                    start.endTime = time;
                    delete this._started[key];
                    this.addToReports(start);
                }
            },
            pause: function() {
                this._paused = true;
            },
            resume: function() {
                this._paused = false;
            },
            flush: function(detailed) {
                if (!this.enable) {
                    return;
                }
                var i, ilen = this._logs.length, result = "", total = 0, count = 0, item, diff;
                if (detailed) {
                    for (i in this._stared) {
                        if (this._started.hasOwnProperty(i)) {
                            result += "STARTED:" + this._started[i].toString() + "\n";
                        }
                    }
                    result += "\n";
                }
                for (i = 0; i < ilen; i += 1) {
                    item = this._logs[i];
                    diff = item.diff();
                    if (diff) {
                        total += diff;
                        count += 1;
                    }
                    if (detailed) {
                        result += item.toString() + "\n";
                    }
                }
                this._started = {};
                this._logs.length = 0;
                return result + "Average: " + (count ? total / count : 0) + "ms\n" + (detailed ? result : "");
            },
            addToReports: function(item) {
                var report = this._reports[item.key] || new ReportItem(item);
                if (!this._reports[item.key]) {
                    this._reports[item.key] = report;
                    this._reportsList.push(report);
                }
                this._reports[item.key].addItem(item);
                if (item.endTime - item.startTime > this.threshold.warnTime) {
                    console.warn("Benchmark:: Warning " + this.threshold.warnTime + "ms exceeded.");
                    this.invalidate(this.filter, this.threshold);
                }
            },
            getKey: function(object) {
                return this.getClassName(object) || "unknown";
            },
            autoBenchMark: function(object, blacklist) {
                if (!this.enable) {
                    return;
                }
                var i, key = this.getKey(object);
                for (i in object) {
                    if (i !== "_super" && i !== "init" && typeof object[i] === "function" && !object[i].ignore && (!blacklist || blacklist.indexOf(i) === -1)) {
                        this.wrap(object, key, i);
                    }
                }
            },
            wrap: function(object, benchKey, method) {
                if (method.indexOf("_bench") !== -1) {
                    object[method].ignore = true;
                    return;
                }
                var methodBenchName = method + "_bench", bench = this, methodName = benchKey + "." + method;
                object[methodBenchName] = object[method];
                object[method] = function BenchMarkInterceptor() {
                    var result;
                    bench.start(methodName, arguments);
                    if (object[methodBenchName]) {
                        result = object[methodBenchName].apply(object, arguments);
                    }
                    bench.stop(methodName);
                    return result;
                }.bind(object);
                if (window.angular) {
                    if (object[methodBenchName].$inject) {
                        object[method].$inject = object[methodBenchName].$inject;
                    } else {
                        var methodStr = object[methodBenchName].toString(), args = methodStr.match(/\((.*?)?\)/)[1];
                        if (args) {
                            object[method].$inject = args ? args.replace(/\s+/g, "").split(",") : [];
                        }
                    }
                }
                object[method].ignore = true;
            },
            getClassName: function(obj) {
                if (obj && obj.constructor && obj.constructor.toString) {
                    var arr = obj.constructor.toString().match(/function\s+(\w+)/);
                    if (arr && arr.length === 2) {
                        return arr[1];
                    } else {
                        return functionName(obj);
                    }
                }
                return "";
            },
            getChartData: function() {
                return this._chartData;
            },
            invalidate: function(filter, threshold) {
                if (!this.enable) {
                    return;
                }
                if (this._paused) {
                    return;
                }
                if (!this._renderPending) {
                    this.filter = filter || "";
                    this.threshold = threshold || this.threshold;
                    this._pendingRender = false;
                    this._pendingFilter = "";
                    this._pendingThreshold = 0;
                    if (!this._renderReportBind) {
                        this._renderReportBind = function() {
                            this._renderReport();
                            clearTimeout(this._renderPending);
                            this._renderPending = 0;
                            if (this._pendingRender) {
                                this.invalidate(this._pendingFilter, this._pendingThreshold);
                            }
                        }.bind(this);
                    }
                    this._renderPending = setTimeout(this._renderReportBind, 100);
                } else {
                    this._pendingRender = true;
                    this._pendingFilter = filter;
                    this._pendingThreshold = filter;
                }
            },
            _renderReport: function() {
                var i = 0, len, report, critical = 100, list, valueKey, colors = [ "#336699", "#CCC", "#009900", "#009900" ], labels = [ "count", "total time", "avg time", "max time" ];
                if (!this.sort) {
                    this.sortReportByCountBind = this.sortReportByCount.bind(this);
                    this.sortReportByTotalTimeBind = this.sortReportByTotalTime.bind(this);
                    this.sortReportByAverageBind = this.sortReportByAverage.bind(this);
                    this.sortReportByMaxBind = this.sortReportByMax.bind(this);
                    this.sortReportByNameBind = this.sortReportByName.bind(this);
                    this.sort = this.sortReportByMaxBind;
                }
                list = this._reportsList;
                if (this.filter || this.threshold) {
                    list = this.filterList(list, this.filter, this.threshold);
                }
                list = list.sort(this.sort);
                len = list.length;
                len = len > this.threshold.maxLength ? this.threshold.maxLength : len;
                if (len < this._chartData.length) {
                    this._chartData.length = len;
                }
                while (i < len) {
                    report = list[i];
                    valueKey = 0;
                    this._chartData[i] = this._chartData[i] || {
                        name: report.key,
                        value: [ report.count(), report.average, report.max ],
                        color: [],
                        label: [],
                        report: report
                    };
                    this._chartData[i].name = report.key;
                    this._chartData[i].message = report.message;
                    if (!this.hide.count) {
                        this._chartData[i].value[valueKey] = report.count();
                        this._chartData[i].color[valueKey] = colors[0];
                        this._chartData[i].label[valueKey] = labels[0];
                        valueKey += 1;
                    }
                    if (!this.hide.totalTime) {
                        this._chartData[i].value[valueKey] = report.totalTime;
                        this._chartData[i].color[valueKey] = colors[1];
                        this._chartData[i].label[valueKey] = labels[1];
                        valueKey += 1;
                    }
                    if (!this.hide.average) {
                        this._chartData[i].value[valueKey] = report.average;
                        this._chartData[i].color[valueKey] = shades.getRGBStr(report.average / critical);
                        this._chartData[i].label[valueKey] = labels[2];
                        valueKey += 1;
                    }
                    if (!this.hide.max) {
                        this._chartData[i].value[valueKey] = report.max;
                        this._chartData[i].color[valueKey] = shades.getRGBStr(report.max / critical);
                        this._chartData[i].label[valueKey] = labels[3];
                    }
                    while (this._chartData[i].value.length - 1 > valueKey) {
                        this._chartData[i].value.pop();
                        this._chartData[i].color.pop();
                        this._chartData[i].label.pop();
                    }
                    i += 1;
                }
                this._chartDataLength = i;
                this.renderer(this._chartData);
            },
            filterList: function(list, filter, threshold) {
                var i = 0, len = list.length, result = [], reportItem;
                filter = (filter || "").toLowerCase();
                while (i < len) {
                    reportItem = list[i];
                    if (this.passThreshold(reportItem, threshold) && reportItem.key.toLowerCase().indexOf(filter) !== -1) {
                        result.push(reportItem);
                    }
                    i += 1;
                }
                return result;
            },
            passThreshold: function(reportItem, threshold) {
                return reportItem.count() >= threshold.count && reportItem.totalTime >= threshold.totalTime && reportItem.average >= threshold.average && reportItem.max >= threshold.max;
            },
            createChartData: function() {
                return [];
            },
            sortReportByCount: function(a, b) {
                return this.sortReport(a, b, "count");
            },
            sortReportByTotalTime: function(a, b) {
                return this.sortReport(a, b, "totalTime");
            },
            sortReportByAverage: function(a, b) {
                return this.sortReport(a, b, "average");
            },
            sortReportByMax: function(a, b) {
                return this.sortReport(a, b, "max");
            },
            sortReportByName: function(a, b) {
                return b.key > a.key ? -1 : b.key < a.key ? 1 : 0;
            },
            sortReport: function(a, b, type) {
                return b[type] - a[type];
            }
        };
        return new Benchmark();
    });
    //! src/utils/timers/repeater.js
    define("repeater", function() {
        var Repeater = function(limit, delay, repeat) {
            var scope = this;
            scope.count = 0;
            scope.delay = delay || 300;
            scope.repeat = repeat || 50;
            scope.limit = limit || 0;
        };
        var p = Repeater.prototype;
        p.check = function() {
            var scope = this;
            scope.count += 1;
            if (scope.limit && scope.count >= scope.limit) {
                scope.stop();
            }
        };
        p.start = function(callback) {
            var scope = this;
            var isFunction = typeof callback;
            scope.count = 0;
            scope.t = setTimeout(function() {
                scope.t = setInterval(function() {
                    scope.check();
                    if (isFunction) {
                        callback(scope);
                    }
                }, scope.repeat);
                scope.check();
                if (isFunction) {
                    callback(scope);
                }
            }, scope.delay);
            scope.check();
            if (isFunction) {
                callback(scope);
            }
        };
        p.stop = function() {
            var scope = this;
            clearTimeout(scope.t);
            clearInterval(scope.t);
        };
        return function(limit, delay, repeat) {
            return new Repeater(limit, delay, repeat);
        };
    });
    //! src/utils/timers/stopwatch.js
    define("stopwatch", [ "timer", "dispatcher" ], function(Timer, dispatcher) {
        var Stopwatch = function(options) {
            options = options || {};
            var scope = this, timer, done = false, _currentTime = 0, currentTime = 0, countdownTime = 0, startTime = options.startTime || 0, endTime = options.endTime || 0, tick = options.tick || 1e3, frequency = 10;
            function init() {
                scope.options = options;
                countdownTime = endTime;
                setupTimer();
                setupDispatcher();
                setupAPI();
                setupListeners();
                setTimeout(function() {
                    scope.dispatch(Stopwatch.events.READY);
                });
            }
            function setupTimer() {
                timer = new Timer({
                    frequency: frequency
                });
            }
            function setupDispatcher() {
                dispatcher(scope);
            }
            function setupAPI() {
                scope.start = start;
                scope.stop = stop;
                scope.reset = reset;
                scope.getTime = getTime;
                scope.getCountdown = getCountdown;
                scope.getTimeRemaining = getTimeRemaining;
                scope.getState = getState;
            }
            function setupListeners() {
                timer.on("start", onStart);
                timer.on("change", onChange);
                timer.on("stop", onStop);
                timer.on("reset", onReset);
            }
            function getTime() {
                var time = Math.floor(currentTime / tick) * tick;
                return time + startTime;
            }
            function getCountdown() {
                return countdownTime;
            }
            function getTimeRemaining() {
                var time = getTime();
                if (endTime) {
                    return endTime - time;
                }
                return 0;
            }
            function roundTime(time) {
                return Math.floor(time / tick) * tick;
            }
            function getState() {
                return timer.current;
            }
            function updateTime(time) {
                currentTime = roundTime(time);
                if (endTime) {
                    countdownTime = endTime - currentTime;
                }
            }
            function start() {
                if (getState() === "ready") {
                    timer.start();
                }
            }
            function stop() {
                timer.stop();
            }
            function reset() {
                timer.reset();
            }
            function onStart(evt, time) {
                updateTime(time);
                scope.dispatch(Stopwatch.events.START);
            }
            function onChange(evt, time) {
                _currentTime = currentTime;
                updateTime(time);
                if (_currentTime !== currentTime) {
                    _currentTime = currentTime;
                    scope.dispatch(Stopwatch.events.CHANGE);
                    if (endTime) {
                        if (getTime() >= endTime) {
                            onDone(evt, time);
                        }
                    }
                }
            }
            function onStop(evt, time) {
                updateTime(time);
                scope.dispatch(Stopwatch.events.STOP);
            }
            function onReset(evt, time) {
                updateTime(time);
                scope.dispatch(Stopwatch.events.RESET);
            }
            function onDone(evt, time) {
                done = true;
                scope.dispatch(Stopwatch.events.DONE);
                timer.stop();
            }
            init();
        };
        Stopwatch.events = {
            READY: "ready",
            START: "start",
            STOP: "stop",
            RESET: "reset",
            CHANGE: "change",
            DONE: "done",
            ERROR: "error"
        };
        return function(options) {
            return new Stopwatch(options);
        };
    });
    //! src/utils/timers/timer.js
    define("timer", [ "dispatcher", "stateMachine" ], function(dispatcher, stateMachine) {
        var Timer = function(options) {
            options = options || {};
            var scope = this, startTime = 0, totalTime = 0, elapsedTime = 0, timer;
            function init() {
                setupStateMachine();
                setupDispatcher();
            }
            function setupStateMachine() {
                stateMachine({
                    target: scope,
                    initial: "ready",
                    error: onError,
                    events: [ {
                        name: "start",
                        from: "ready",
                        to: "running"
                    }, {
                        name: "start",
                        from: "stop",
                        to: "running"
                    }, {
                        name: "stop",
                        from: "running",
                        to: "stop"
                    }, {
                        name: "reset",
                        from: "stop",
                        to: "ready"
                    } ],
                    callbacks: {
                        onafterstart: onStart,
                        onafterstop: onStop,
                        onafterreset: onReset
                    }
                });
            }
            function setupDispatcher() {
                dispatcher(scope);
            }
            function onStart() {
                startTime = Date.now();
                timer = setInterval(function() {
                    elapsedTime = getTime();
                    scope.dispatch(Timer.events.CHANGE, getTotalTime());
                }, options.frequency || 1e3);
                scope.dispatch(Timer.events.START, totalTime);
            }
            function onStop() {
                clearInterval(timer);
                elapsedTime = getTime();
                totalTime += elapsedTime;
                scope.dispatch(Timer.events.STOP, totalTime);
            }
            function onReset() {
                totalTime = 0;
                scope.dispatch(Timer.events.RESET, totalTime);
            }
            function onError(eventName, from, to, args, errorCode, errorMessage) {
                scope.dispatch(Timer.events.ERROR, {
                    name: eventName,
                    from: from,
                    to: to,
                    args: args,
                    errorCode: errorCode,
                    errorMessage: errorMessage
                });
            }
            function getTime() {
                if (scope.current === "ready") {
                    return 0;
                }
                return Date.now() - startTime;
            }
            function getTotalTime() {
                var elapsedTime = getTime();
                return totalTime + elapsedTime;
            }
            scope.getTime = getTime;
            scope.getTotalTime = getTotalTime;
            init();
        };
        Timer.events = {
            START: "start",
            STOP: "stop",
            RESET: "reset",
            CHANGE: "change",
            ERROR: "error"
        };
        return function(options) {
            return new Timer(options);
        };
    });
    //! src/utils/validators/isArrayLike.js
    define("isArrayLike", [ "isWindow", "isString", "isArray" ], function(isWindow, isString, isArray) {
        var isArrayLike = function(obj) {
            if (obj === null || isWindow(obj)) {
                return false;
            }
            var length = obj.length;
            if (obj.nodeType === 1 && length) {
                return true;
            }
            return isString(obj) || isArray(obj) || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;
        };
        return isArrayLike;
    });
    //! src/utils/validators/isBoolean.js
    define("isBoolean", function() {
        var isBoolean = function(val) {
            return typeof val === "boolean";
        };
        return isBoolean;
    });
    //! src/utils/validators/isEmail.js
    define("isEmail", function() {
        var isEmail = function(val) {
            var regExp = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9])+$/;
            return regExp.test(val + "");
        };
        return isEmail;
    });
    //! src/utils/validators/isEqual.js
    define("isEqual", function() {
        var isEqual = function(src, target, deep) {
            var srcKeys, targetKeys, srcLen, targetLen, i, s, t;
            if (typeof src === "string" || typeof src === "number" || typeof src === "boolean") {
                return src === target;
            }
            srcKeys = Object.keys(src);
            targetKeys = Object.keys(target);
            srcLen = srcKeys.length;
            targetLen = targetKeys.length;
            if (srcLen !== targetLen) {
                return false;
            }
            if (deep) {
                for (i = 0; i < srcLen; i += 1) {
                    s = src[srcKeys[i]];
                    t = src[targetKeys[i]];
                    if (typeof s === "object" && t && !isEqual(src[srcKeys[i]], target[srcKeys[i]], deep)) {
                        return false;
                    }
                }
            }
            return true;
        };
        return isEqual;
    });
    //! src/utils/validators/isFile.js
    define("isFile", [ "toString" ], function(toString) {
        var isFile = function(obj) {
            return toString.call(obj) === "[object File]";
        };
        return isFile;
    });
    //! src/utils/validators/isInt.js
    define("isInt", function() {
        var isInt = function(val) {
            return String(val).search(/^\s*(\-)?\d+\s*$/) !== -1;
        };
        return isInt;
    });
    //! src/utils/validators/isJson.js
    define("isJson", function() {
        var isJson = function(str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        };
        return isJson;
    });
    //! src/utils/validators/isMobile.js
    /**
 * isMobile.js v0.3.2
 *
 * A simple library to detect Apple phones and tablets,
 * Android phones and tablets, other mobile devices (like blackberry, mini-opera and windows phone),
 * and any kind of seven inch device, via user agent sniffing.
 *
 * @author: Kai Mallea (kmallea@gmail.com)
 *
 * @license: http://creativecommons.org/publicdomain/zero/1.0/
 */
    define("isMobile", function() {
        var apple_phone = /iPhone/i, apple_ipod = /iPod/i, apple_tablet = /iPad/i, android_phone = /(?=.*\bAndroid\b)(?=.*\bMobile\b)/i, android_tablet = /Android/i, windows_phone = /IEMobile/i, windows_tablet = /(?=.*\bWindows\b)(?=.*\bARM\b)/i, other_blackberry = /BlackBerry/i, other_opera = /Opera Mini/i, other_firefox = /(?=.*\bFirefox\b)(?=.*\bMobile\b)/i, seven_inch = new RegExp("(?:" + "Nexus 7" + "|" + "BNTV250" + "|" + "Kindle Fire" + "|" + "Silk" + "|" + "GT-P1000" + ")", "i");
        var match = function(regex, userAgent) {
            return regex.test(userAgent);
        };
        var IsMobileClass = function(userAgent) {
            var ua = userAgent || navigator.userAgent;
            this.apple = {
                phone: match(apple_phone, ua),
                ipod: match(apple_ipod, ua),
                tablet: match(apple_tablet, ua),
                device: match(apple_phone, ua) || match(apple_ipod, ua) || match(apple_tablet, ua)
            };
            this.android = {
                phone: match(android_phone, ua),
                tablet: !match(android_phone, ua) && match(android_tablet, ua),
                device: match(android_phone, ua) || match(android_tablet, ua)
            };
            this.windows = {
                phone: match(windows_phone, ua),
                tablet: match(windows_tablet, ua),
                device: match(windows_phone, ua) || match(windows_tablet, ua)
            };
            this.other = {
                blackberry: match(other_blackberry, ua),
                opera: match(other_opera, ua),
                firefox: match(other_firefox, ua),
                device: match(other_blackberry, ua) || match(other_opera, ua) || match(other_firefox, ua)
            };
            this.seven_inch = match(seven_inch, ua);
            this.any = this.apple.device || this.android.device || this.windows.device || this.other.device || this.seven_inch;
            this.phone = this.apple.phone || this.android.phone || this.windows.phone;
            this.tablet = this.apple.tablet || this.android.tablet || this.windows.tablet;
            if (typeof window === "undefined") {
                return this;
            }
        };
        var instantiate = function() {
            var IM = new IsMobileClass();
            IM.Class = IsMobileClass;
            return IM;
        };
        return instantiate();
    });
    //! src/utils/validators/isNumeric.js
    define("isNumeric", function() {
        var isNumeric = function(val) {
            return !isNaN(parseFloat(val)) && isFinite(val);
        };
        return isNumeric;
    });
    //! src/utils/validators/isRequired.js
    define("isRequired", function() {
        var isRequired = function(value, message) {
            if (typeof value === "undefined") {
                throw new Error(message || 'The property "' + value + '" is required');
            }
        };
        return isRequired;
    });
    //! src/utils/validators/isTouchDevice.js
    define("isTouchDevice", function() {
        return "ontouchstart" in window || "onmsgesturechange" in window;
    });
    //! src/utils/validators/isTrue.js
    define("isTrue", function() {
        var emptyStr = "";
        var isTrue = function() {
            return {
                operators: [ "eq", "neq", "~eq", "~neq", "gt", "lt", "gte", "lte" ],
                test: function(valA, operator, valB) {
                    if (!isNaN(valA) && !isNaN(valB)) {
                        valA = Number(valA);
                        valB = Number(valB);
                    } else {
                        valA = valA === undefined ? emptyStr : valA;
                        valB = valB === undefined ? emptyStr : valB;
                    }
                    switch (operator) {
                      case "eq":
                        return valA + emptyStr === valB + emptyStr;

                      case "neq":
                        return valA + emptyStr !== valB + emptyStr;

                      case "~eq":
                        return (valA + emptyStr).toLowerCase() === (valB + emptyStr).toLowerCase();

                      case "~neq":
                        return (valA + emptyStr).toLowerCase() !== (valB + emptyStr).toLowerCase();

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
        return isTrue;
    });
    for (var name in cache) {
        resolve(name, cache[name]);
    }
})(this["hb"] || {}, function() {
    return this;
}());