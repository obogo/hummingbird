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
                args.push(exports.hasOwnProperty(injectionName) && exports[injectionName] || internals.hasOwnProperty(injectionName) && internals[injectionName]);
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
    //! src/utils/iterators/matchIndexOf.js
    define("matchIndexOf", [ "isMatch" ], function(isMatch) {
        function matchesAny(ary, filterObj) {
            for (var i = 0, len = ary.length; i < len; i += 1) {
                if (isMatch(ary[i], filterObj)) {
                    return i;
                }
            }
            return -1;
        }
        return matchesAny;
    });
    //! src/hb/utils/asyncRender.js
    internal("asyncRender", [ "dispatcher", "hb.eventStash" ], function(dispatcher, events) {
        var UP = "up";
        var DOWN = "down";
        events.ASYNC_RENDER_CHUNK_END = "async::chunk_end";
        events.ASYNC_RENDER_COMPLETE = "async::complete";
        function AsyncRender() {
            this.down = DOWN;
            this.up = UP;
            this.direction = DOWN;
            this.index = 0;
            this.len = 0;
            this.maxLen = 0;
            this.size = 0;
            this.complete = false;
            this.atChunkEnd = false;
            dispatcher(this);
        }
        var p = AsyncRender.prototype;
        p.setup = function(direction, size, maxLen) {
            this.direction = direction;
            this.size = size;
            this.len = 0;
            this.maxLen = maxLen;
            this.atChunkEnd = false;
            this.complete = false;
            this.index = direction === DOWN ? 0 : maxLen - 1;
        };
        p.inc = function() {
            if (this.complete || this.atChunkEnd) {
                return;
            }
            if (this.direction === DOWN) {
                if (this.index < this.len) {
                    this.index += 1;
                    if (this.index === this.len) {
                        this.finishChunk();
                    }
                } else {
                    this.finishChunk();
                }
            } else {
                if (this.index > this.maxLen - this.len - 1) {
                    this.index -= 1;
                }
                if (this.index <= this.maxLen - this.len - 1) {
                    this.finishChunk();
                }
            }
        };
        p.finishChunk = function() {
            if (!this.complete && !this.atChunkEnd) {
                this.atChunkEnd = true;
                if ((this.index === -1 || this.index === this.maxLen) && this.len === this.maxLen) {
                    this.finish();
                }
                this.dispatch(events.ASYNC_RENDER_CHUNK_END);
            }
        };
        p.next = function() {
            if (this.complete) {
                this.dispatch(events.ASYNC_RENDER_COMPLETE);
                this.direction = DOWN;
                return false;
            }
            var increase = Math.min(this.size, this.maxLen);
            if (!increase) {
                return false;
            }
            if (this.len + increase > this.maxLen) {
                increase = this.maxLen - this.len;
            }
            if (this.direction === UP) {
                this.index = this.maxLen - this.len - 1;
            }
            this.len += increase;
            this.atChunkEnd = false;
            return true;
        };
        p.finish = function() {
            this.complete = true;
        };
        return {
            create: function() {
                return new AsyncRender();
            }
        };
    });
    //! src/utils/async/dispatcher.js
    define("dispatcher", [ "apply" ], function(apply) {
        function Event(type) {
            this.type = event;
            this.defaultPrevented = false;
            this.propagationStopped = false;
            this.immediatePropagationStopped = false;
        }
        Event.prototype.preventDefault = function() {
            this.defaultPrevented = true;
        };
        Event.prototype.stopPropagation = function() {
            this.propagationStopped = true;
        };
        Event.prototype.stopImmediatePropagation = function() {
            this.immediatePropagationStopped = true;
        };
        Event.prototype.toString = function() {
            return this.type;
        };
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
                    apply(callback, scope || target, arguments);
                }
                return on(event, fn);
            }
            function getListeners(event, strict) {
                var list, a = "*";
                if (event || strict) {
                    list = [];
                    if (listeners[a]) {
                        list = listeners[a].concat(list);
                    }
                    if (listeners[event]) {
                        list = listeners[event].concat(list);
                    }
                    return list;
                }
                return listeners;
            }
            function removeAllListeners() {
                listeners = {};
            }
            function fire(callback, args) {
                return callback && apply(callback, target, args);
            }
            function dispatch(event) {
                var list = getListeners(event, true), len = list.length, i, event = new Event(arguments[0]);
                if (len) {
                    arguments[0] = event;
                    for (i = 0; i < len; i += 1) {
                        if (!event.immediatePropagationStopped) {
                            fire(list[i], arguments);
                        }
                    }
                }
                return event;
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
    //! src/utils/data/apply.js
    define("apply", function() {
        return function(func, scope, args) {
            args = args || [];
            switch (args.length) {
              case 0:
                return func.call(scope);

              case 1:
                return func.call(scope, args[0]);

              case 2:
                return func.call(scope, args[0], args[1]);

              case 3:
                return func.call(scope, args[0], args[1], args[2]);

              case 4:
                return func.call(scope, args[0], args[1], args[2], args[3]);

              case 5:
                return func.call(scope, args[0], args[1], args[2], args[3], args[4]);

              case 6:
                return func.call(scope, args[0], args[1], args[2], args[3], args[4], args[5]);
            }
            return func.apply(scope, args);
        };
    });
    //! src/utils/iterators/indexOfMatch.js
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
                if (item instanceof Array && filterObj[0] !== undefined) {
                    for (var i = 0; i < item.length; i += 1) {
                        if (isMatch(item[i], filterObj[0])) {
                            return true;
                        }
                    }
                    return false;
                } else {
                    for (var j in filterObj) {
                        if (filterObj.hasOwnProperty(j)) {
                            if (!item.hasOwnProperty(j)) {
                                return false;
                            }
                            if (!isMatch(item[j], filterObj[j])) {
                                return false;
                            }
                        }
                    }
                }
                return true;
            } else if (typeof filterObj === "function") {
                return !!filterObj(item);
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
    //! src/utils/iterators/matchAllOthers.js
    define("matchAllOthers", [ "isMatch" ], function(isMatch) {
        function matchAllOthers(ary, filterObj) {
            var result = [];
            for (var i = 0, len = ary.length; i < len; i += 1) {
                if (!isMatch(ary[i], filterObj)) {
                    result.push(ary[i]);
                }
            }
            return result;
        }
        return matchAllOthers;
    });
    //! src/utils/iterators/matchAll.js
    define("matchAll", [ "isMatch" ], function(isMatch) {
        function matchAll(ary, filterObj) {
            var result = [];
            for (var i = 0; i < ary.length; i += 1) {
                if (isMatch(ary[i], filterObj)) {
                    result.push(ary[i]);
                }
            }
            return result;
        }
        return matchAll;
    });
    //! src/hb/eventStash.js
    define("hb.eventStash", function() {
        var events = new function EventStash() {}();
        events.HB_READY = "hb::ready";
        return events;
    });
    //! src/utils/array/sort.js
    define("sort", function() {
        function partition(array, left, right, compareFunction) {
            var cmp = array[right - 1], minEnd = left, maxEnd, dir = 0;
            for (maxEnd = left; maxEnd < right - 1; maxEnd += 1) {
                dir = compareFunction(array[maxEnd], cmp);
                if (dir < 0) {
                    if (maxEnd !== minEnd) {
                        swap(array, maxEnd, minEnd);
                    }
                    minEnd += 1;
                }
            }
            if (compareFunction(array[minEnd], cmp)) {
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
        return function(array, compareFunction) {
            var result = quickSort(array, 0, array.length, compareFunction);
            return result;
        };
    });
    //! src/utils/data/extend.js
    define("extend", [ "toArray" ], function(toArray) {
        var extend = function(target, source) {
            var args = toArray(arguments), i = 1, len = args.length, item, j;
            var options = this || {}, copy;
            if (!target && source && typeof source === "object") {
                target = {};
            }
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
    //! src/utils/parsers/parseRoute.js
    define("parseRoute", [ "each" ], function(each) {
        var rx1 = /:(\w+)/g;
        var rx2 = /\/:(\w+)/g;
        function keyValues(key, index, list, params) {
            if (key[0] === ":") {
                params.result[key.replace(":", "")] = params.parts[index];
            }
        }
        function urlKeyValues(str, index, list, result) {
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
            each(patternUrl.split("/"), {
                result: params,
                parts: parts
            }, keyValues);
            if (searchParams) {
                each(searchParams.split("&"), queryParams, urlKeyValues);
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
        function matchParam(value, index, list, params) {
            if (value === "") {} else if (!params.values.hasOwnProperty(value) || params.values[value] === undefined) {
                params.hasParams = false;
            }
        }
        function match(patternUrl, url) {
            var patternParams = patternUrl.indexOf("?") !== -1 ? patternUrl.split("?").pop().split("&") : [];
            patternUrl.replace(rx1, function(match, g) {
                patternParams.push(g);
                return match;
            });
            var params = {
                values: extractParams(patternUrl.split("?").shift(), url, true),
                hasParams: !!patternParams.length
            };
            if (params.hasParams) {
                each(patternParams, params, matchParam);
                if (!params.hasParams) {
                    return null;
                }
            }
            var matchUrl = patternUrl.split("?").shift().replace(rx2, function(match, g1) {
                return "/" + params.values[g1];
            });
            var endOfPathName = getPathname(url, true);
            return endOfPathName === matchUrl;
        }
        return {
            extractParams: extractParams,
            match: match
        };
    });
    //! src/utils/iterators/each.js
    define("each", function() {
        var regex = /([^\s,]+)/g;
        function getParamNames(fn) {
            var funStr = fn.toString();
            return funStr.slice(funStr.indexOf("(") + 1, funStr.indexOf(")")).match(regex);
        }
        function each(list) {
            var params, handler, done;
            if (typeof arguments[1] === "function") {
                handler = arguments[1];
                done = arguments[2];
            } else {
                params = arguments[1] || {};
                handler = arguments[2];
                done = arguments[3];
            }
            var next;
            var len = list.length;
            var index = 0;
            var returnVal;
            var paramNames = getParamNames(handler);
            var iterate = function() {
                if (index < len) {
                    try {
                        if (params) {
                            returnVal = handler(list[index], index, list, params, next);
                        } else {
                            returnVal = handler(list[index], index, list, next);
                        }
                    } catch (e) {
                        return done && done(e);
                    }
                    if (returnVal !== undefined) {
                        iterate = null;
                        return done(returnVal);
                    }
                    index += 1;
                    if (!next) {
                        iterate();
                    }
                } else if (typeof done === "function") {
                    iterate = null;
                    done();
                }
            };
            if (params) {
                if (paramNames.length === 5) {
                    next = function() {
                        setTimeout(iterate, 0);
                    };
                }
            } else {
                if (paramNames.length === 4) {
                    next = function() {
                        setTimeout(iterate, 0);
                    };
                }
            }
            iterate();
        }
        return each;
    });
    //! tests/helpers/define.js
    define("define", function() {
        return function(name) {
            define.apply(this, arguments);
            resolve(name, cache[name]);
        };
    });
    for (var name in cache) {
        resolve(name, cache[name]);
    }
})(this["hb"] || {}, function() {
    return this;
}());