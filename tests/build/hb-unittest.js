(function(exports, global) {
    global["hb"] = exports;
    var define, internal, finalize = function() {};
    (function() {
        var get, defined, pending, definitions, initDefinition, $cachelyToken = "~", $depsRequiredByDefinitionToken = ".";
        get = Function[$cachelyToken] = Function[$cachelyToken] || function(name) {
            if (!get[name]) {
                get[name] = {};
            }
            return get[name];
        };
        definitions = get("c");
        defined = get("d");
        pending = get("p");
        initDefinition = function(name) {
            var args = arguments;
            var val = args[1];
            if (typeof val === "function") {
                defined[name] = val();
            } else {
                definitions[name] = args[2];
                definitions[name][$depsRequiredByDefinitionToken] = val;
            }
        };
        define = internal = function() {
            initDefinition.apply(null, arguments);
        };
        resolve = function(name, fn) {
            pending[name] = true;
            var deps = fn[$depsRequiredByDefinitionToken];
            var args = [];
            var i, len;
            var dependencyName;
            if (deps) {
                len = deps.length;
                for (i = 0; i < len; i++) {
                    dependencyName = deps[i];
                    if (definitions[dependencyName]) {
                        if (!pending.hasOwnProperty(dependencyName)) {
                            resolve(dependencyName, definitions[dependencyName]);
                        }
                        resolve(dependencyName, definitions[dependencyName]);
                        delete definitions[dependencyName];
                    }
                }
            }
            if (!defined.hasOwnProperty(name)) {
                for (i = 0; i < len; i++) {
                    dependencyName = deps[i];
                    args.push(defined.hasOwnProperty(dependencyName) && defined[dependencyName]);
                }
                defined[name] = fn.apply(null, args);
            }
            delete pending[name];
        };
        finalize = function() {
            for (var name in definitions) {
                resolve(name, definitions[name]);
            }
        };
        return define;
    })();
    //! ################# YOUR CODE STARTS HERE #################### //
    //! src/utils/data/copy.js
    define("copy", [ "apply", "extend" ], function(apply, extend) {
        function copy(source) {
            return apply(extend, this, [ {}, source ]);
        }
        return copy;
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
    define("dispatcher", [ "apply", "isFunction" ], function(apply, isFunction) {
        function Event(type) {
            this.type = type;
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
        function validateEvent(e) {
            if (!e) {
                throw Error("event cannot be undefined");
            }
        }
        var dispatcher = function(target, scope, map) {
            if (target && target.on && target.on.dispatcher) {
                return target;
            }
            target = target || {};
            var listeners = {};
            function off(event, callback) {
                validateEvent(event);
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
                if (isFunction(callback)) {
                    validateEvent(event);
                    listeners[event] = listeners[event] || [];
                    listeners[event].push(callback);
                    return function() {
                        off(event, callback);
                    };
                }
            }
            on.dispatcher = true;
            function once(event, callback) {
                if (isFunction(callback)) {
                    validateEvent(event);
                    function fn() {
                        off(event, fn);
                        apply(callback, scope || target, arguments);
                    }
                    return on(event, fn);
                }
            }
            function getListeners(event, strict) {
                validateEvent(event);
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
                validateEvent(event);
                var list = getListeners(event, true), len = list.length, i, event = typeof event === "object" ? event : new Event(event);
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
    define("apply", [ "isFunction" ], function(isFunction) {
        return function(func, scope, args) {
            if (!isFunction(func)) {
                return;
            }
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
    //! src/utils/validators/isFunction.js
    define("isFunction", function() {
        var isFunction = function(val) {
            return typeof val === "function";
        };
        return isFunction;
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
    define("isMatch", [ "isRegExp", "isDate" ], function(isRegExp, isDate) {
        var primitive = [ "string", "number", "boolean" ];
        function isMatch(item, filterObj) {
            var itemType;
            if (item === filterObj) {
                return true;
            } else if (typeof filterObj === "object") {
                itemType = typeof item;
                if (primitive.indexOf(itemType) !== -1) {
                    if (isRegExp(filterObj) && !filterObj.test(item + "")) {
                        return false;
                    } else if (isDate(filterObj)) {
                        if (isDate(item) && filterObj.getTime() === item.getTime()) {
                            return true;
                        }
                        return false;
                    }
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
                            if (item[j] === undefined && !item.hasOwnProperty(j)) {
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
    //! src/utils/validators/isDate.js
    define("isDate", function() {
        var isDate = function(val) {
            return val instanceof Date;
        };
        return isDate;
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
    //! src/hb/eventStash.js
    define("hb.eventStash", function() {
        var events = new function EventStash() {}();
        events.HB_READY = "hb::ready";
        return events;
    });
    //! src/utils/data/extend.js
    define("extend", [ "isWindow", "apply", "toArray", "isArray", "isDate", "isRegExp" ], function(isWindow, apply, toArray, isArray, isDate, isRegExp) {
        var extend = function(target, source) {
            if (isWindow(source)) {
                throw Error("Can't extend! Making copies of Window instances is not supported.");
            }
            if (source === target) {
                return target;
            }
            var args = toArray(arguments), i = 1, len = args.length, item, j;
            var options = this || {}, copy;
            if (!target && source && typeof source === "object") {
                target = {};
            }
            while (i < len) {
                item = args[i];
                for (j in item) {
                    if (item.hasOwnProperty(j)) {
                        if (isDate(item[j])) {
                            target[j] = new Date(item[j].getTime());
                        } else if (isRegExp(item[j])) {
                            target[j] = new RegExp(item[j]);
                        } else if (j === "length" && target instanceof Array) {} else if (target[j] && typeof target[j] === "object" && !item[j] instanceof Array) {
                            target[j] = apply(extend, options, [ target[j], item[j] ]);
                        } else if (isArray(item[j])) {
                            copy = options && options.concat ? (target[j] || []).concat(item[j]) : item[j];
                            if (options && options.arrayAsObject) {
                                if (!target[j]) {
                                    target[j] = {
                                        length: copy.length
                                    };
                                }
                                if (target[j] instanceof Array) {
                                    target[j] = apply(extend, options, [ {}, target[j] ]);
                                }
                            } else {
                                target[j] = target[j] || [];
                            }
                            if (copy.length) {
                                target[j] = apply(extend, options, [ target[j], copy ]);
                            }
                        } else if (item[j] && typeof item[j] === "object") {
                            if (options.objectAsArray && typeof item[j].length === "number") {
                                if (!(target[j] instanceof Array)) {
                                    target[j] = apply(extend, options, [ [], target[j] ]);
                                }
                            }
                            target[j] = apply(extend, options, [ target[j] || {}, item[j] ]);
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
    //! src/utils/validators/isWindow.js
    define("isWindow", function() {
        var isWindow = function(obj) {
            return obj && obj.document && obj.location && obj.alert && obj.setInterval;
        };
        return isWindow;
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
    //! src/utils/geom/getDistanceToRect.js
    define("getDistanceToRect", [], function() {
        return function(rect, pt) {
            var cx = Math.max(Math.min(pt.x, rect.x + rect.width), rect.x);
            var cy = Math.max(Math.min(pt.y, rect.y + rect.height), rect.y);
            return Math.sqrt((pt.x - cx) * (pt.x - cx) + (pt.y - cy) * (pt.y - cy));
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
    //! src/utils/geom/degreesToRadians.js
    define("degreesToRadians", function() {
        return function degreesToRadians(deg) {
            return deg * (Math.PI / 180);
        };
    });
    //! src/utils/geom/getPointOnRect.js
    define("getPointOnRect", [ "getCenterOfRect", "getPointOnCircle" ], function(getCenterOfRect, getPointOnCircle) {
        return function(rect, angle) {
            var radius = Math.min(rect.width, rect.height) * .5;
            var c = getCenterOfRect(rect);
            var pt = getPointOnCircle(c.x, c.y, radius, angle);
            var left = Math.abs(rect.x - pt.x);
            var top = Math.abs(rect.y - pt.y);
            var right = Math.abs(rect.x + rect.width - pt.x);
            var bottom = Math.abs(rect.y + rect.height - pt.y);
            var min = Math.min(left, top, right, bottom);
            if (min === left) {
                pt.x = rect.x;
            } else if (min === top) {
                pt.y = rect.y;
            } else if (min === right) {
                pt.x = rect.x + rect.width;
            } else if (min === bottom) {
                pt.y = rect.y + rect.height;
            }
            return pt;
        };
    });
    //! src/utils/geom/getCenterOfRect.js
    internal("getCenterOfRect", [], function() {
        return function(rect) {
            return {
                x: rect.x + rect.width * .5,
                y: rect.y + rect.height * .5
            };
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
            var index = 0;
            var returnVal;
            var paramNames = getParamNames(handler);
            var keys;
            var len;
            if (list.length === undefined) {
                keys = Object.keys(list);
                len = keys.length;
            }
            var iterate = function() {
                len = keys ? len : list.length;
                if (index < len) {
                    try {
                        if (params) {
                            returnVal = handler(keys ? list[keys[index]] : list[index], keys ? keys[index] : index, list, params, next);
                        } else {
                            returnVal = handler(keys ? list[keys[index]] : list[index], keys ? keys[index] : index, list, next);
                        }
                    } catch (e) {
                        if (done) {
                            done(e, list, params);
                        } else {
                            throw e;
                        }
                    }
                    if (returnVal !== undefined) {
                        iterate = null;
                        if (done) {
                            done(returnVal, list, params);
                            return;
                        }
                        return returnVal;
                    }
                    if (!next) {
                        index += 1;
                        iterate();
                    }
                } else if (typeof done === "function") {
                    iterate = null;
                    done(null, list, params);
                }
            };
            var now = Date.now();
            function iter(threshold) {
                var current;
                index += 1;
                if (threshold) {
                    current = Date.now();
                    if (current < now + threshold) {
                        current = Date.now();
                        iterate();
                        return;
                    }
                    now = current;
                }
                setTimeout(iterate, 0);
            }
            if (params) {
                if (paramNames && paramNames.length === 5) {
                    next = iter;
                }
            } else {
                if (paramNames && paramNames.length === 4) {
                    next = iter;
                }
            }
            iterate();
        }
        return each;
    });
    //! src/utils/parsers/route.js
    define("route", [ "each" ], function(each) {
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
            match: match,
            extractParams: extractParams
        };
    });
    //! tests/helpers/define.js
    define("define", function() {
        var cache = {};
        exports.define = function(name) {
            define.apply(this, arguments);
            resolve(name, cache[name]);
        };
    });
    //! #################  YOUR CODE ENDS HERE  #################### //
    finalize();
})(this["hb"] || {}, function() {
    return this;
}());