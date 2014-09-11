/*
* angular 0.1.0
* Obogo. MIT 2014
*/
(function(exports, global) {
    global["angular"] = exports;
    var app = {};
    var helpers = {};
    helpers.each = function(list, method) {
        var i = 0, len, result, extraArgs;
        if (arguments.length > 2) {
            extraArgs = Array.prototype.slice.apply(arguments);
            extraArgs.splice(0, 2);
        }
        if (list && list.length && list.hasOwnProperty(0)) {
            len = list.length;
            while (i < len) {
                result = method.apply(this.scope, [ list[i], i, list ].concat(extraArgs));
                if (result !== undefined) {
                    return result;
                }
                i += 1;
            }
        } else if (!(list instanceof Array) && list.length === undefined) {
            for (i in list) {
                if (list.hasOwnProperty(i) && (!this.omit || !this.omit[i])) {
                    result = method.apply(this.scope, [ list[i], i, list ].concat(extraArgs));
                    if (result !== undefined) {
                        return result;
                    }
                }
            }
        }
        return list;
    };
    var formatters = {};
    formatters.stripLineBreaks = function(str) {
        str = str + "";
        return str.replace(/\s+/g, " ");
    };
    formatters.stripExtraSpaces = function(str) {
        str = str + "";
        return str.replace(/(\r\n|\n|\r)/gm, "");
    };
    function Injector() {
        "use strict";
        var self = this, registered = {}, injector = {};
        function invoke(fn, scope, locals) {
            var f;
            if (fn instanceof Array) {
                f = fn.pop();
                f.$inject = fn;
                fn = f;
            }
            if (!fn.$inject) {
                fn.$inject = getInjectionArgs(fn);
            }
            var args = fn.$inject ? fn.$inject.slice() : [];
            helpers.each(args, getInjection, locals);
            return fn.apply(scope, args);
        }
        function getInjectionArgs(fn) {
            var str = fn.toString();
            return str.match(/\(.*\)/)[0].match(/([\$\w])+/gm);
        }
        function getInjection(type, index, list, locals) {
            var result, cacheValue = self.get(type);
            if (cacheValue !== undefined) {
                result = cacheValue;
            } else if (locals && locals[type]) {
                result = locals[type];
            }
            list[index] = result;
        }
        function getRegistered() {
            return registered;
        }
        self.invoke = invoke;
        self.getInjection = getInjection;
        self.getRegistered = getRegistered;
        self.set = function(name, fn) {
            registered[name.toLowerCase()] = fn;
        };
        self.get = function(name) {
            return registered[name.toLowerCase()];
        };
    }
    function Interpolate(injector) {
        "use strict";
        var self = this;
        var ths = "this";
        var each = helpers.each;
        var errorHandler = function(er, extraMessage, data) {
            if (window.console && console.warn) {
                console.warn(extraMessage + "\n" + er.message + "\n" + (er.stack || er.stacktrace || er.backtrace), data);
            }
        };
        function setErrorHandler(fn) {
            errorHandler = fn;
        }
        function interpolateError(er, scope, str, errorHandler) {
            errorHandler(er, app.errors.MESSAGES.E6a + str + app.errors.MESSAGES.E6b, scope);
        }
        function fixStrReferences(str, scope) {
            var c = 0, matches = [], i = 0, len;
            str = str.replace(/('|").*?\1/g, function(str, p1, offset, wholeString) {
                var result = "*" + c;
                matches.push(str);
                c += 1;
                return result;
            });
            str = str.replace(/\b(\.?[a-zA-z\$\_]\w+)/g, function(str, p1, offset, wholeString) {
                if (str.charAt(0) === ".") {
                    return str;
                }
                return lookupStrDepth(str, scope);
            });
            len = matches.length;
            while (i < len) {
                str = str.split("*" + i).join(matches[i]);
                i += 1;
            }
            return str;
        }
        function lookupStrDepth(str, scope) {
            var ary = [ ths ];
            while (scope && scope[str] === undefined) {
                scope = scope.$parent;
                ary.push("$parent");
            }
            if (scope && scope[str]) {
                return ary.join(".") + "." + str;
            }
            return ths + "." + str;
        }
        function parseFilter(str, scope) {
            if (str.indexOf("|") !== -1 && str.match(/\w+\s?\|\s?\w+/)) {
                str = str.replace("||", "~~");
                var parts = str.trim().split("|");
                parts[1] = parts[1].replace("~~", "||");
                each(parts, app.utils.trimStrings);
                parts[1] = parts[1].split(":");
                var filterName = parts[1].shift(), filter = injector.get(filterName), args;
                if (!filter) {
                    return parts[0];
                } else {
                    args = parts[1];
                }
                each(args, injector.getInjection, scope);
                return {
                    filter: function(value) {
                        args.unshift(value);
                        return injector.invoke(filter, scope, {
                            alias: filterName
                        }).apply(scope, args);
                    },
                    str: parts[0]
                };
            }
            return undefined;
        }
        function interpolate(scope, str) {
            var fn = Function, result, filter;
            str = formatters.stripLineBreaks(str);
            str = formatters.stripExtraSpaces(str);
            filter = parseFilter(str, scope);
            if (filter) {
                str = filter.str;
            }
            str = fixStrReferences(str, scope);
            result = new fn("var result; try { result = " + str + "; } catch(er) { result = er; } finally { return result; }").apply(scope);
            if (typeof result === "object" && (result.hasOwnProperty("stack") || result.hasOwnProperty("stacktrace") || result.hasOwnProperty("backtrace"))) {
                interpolateError(result, scope, str, errorHandler);
            }
            if (result + "" === "NaN") {
                result = "";
            }
            return filter ? filter.filter(result) : result;
        }
        self.exec = interpolate;
        self.setErrorHandler = setErrorHandler;
    }
    app.errors = {};
    app.errors.MESSAGES = {
        E1: "Trying to assign multiple scopes to the same dom element is not permitted.",
        E2: "Unable to find element",
        E3: "Exceeded max digests of ",
        E4: "parent element not found in %o",
        E5: "property is not of type object",
        E6a: 'Error evaluating: "',
        E6b: '" against %o',
        E7: "$digest already in progress."
    };
    var validators = {};
    validators.isArray = function(val) {
        return val ? !!val.isArray : false;
    };
    validators.isArrayLike = function(obj) {
        if (obj === null || validators.isWindow(obj)) {
            return false;
        }
        var length = obj.length;
        if (obj.nodeType === 1 && length) {
            return true;
        }
        return validators.isString(obj) || validators.isArray(obj) || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;
    };
    validators.isFunction = function(val) {
        return typeof val === "function";
    };
    validators.isString = function isString(val) {
        return typeof val === "string";
    };
    validators.isWindow = function(obj) {
        return obj && obj.document && obj.location && obj.alert && obj.setInterval;
    };
    (function() {
        var injector = new Injector(), interpolate = new Interpolate(injector), counter = 0, name = "unit", $DESTROY = "$destroy", MAX_DIGESTS = 10, elements = {}, each = helpers.each, rootScope = new Scope();
        function uuid() {
            return name + "-" + (counter++).toString(16);
        }
        function Scope() {
            this.$id = uuid();
            this.$$watchers = [];
            this.$$listeners = {};
            this.$$handlers = [];
            this.$root = rootScope;
        }
        var scopePrototype = Scope.prototype;
        scopePrototype.$digest = digest;
        scopePrototype.$destroy = function() {
            this.$off($DESTROY, this.$destroy);
            this.$broadcast($DESTROY);
            this.$$watchers = this.$$listeners = null;
            while (this.$$handlers.length) this.$$handlers.pop()();
            if (this.$$prevSibling) {
                this.$$prevSibling.$$nextSibling = this.$$nextSibling;
            }
            this.$$nextSibling = this.$$prevSibling;
            if (this.$parent && this.$parent.$$childHead === this) {
                this.$parent.$$childHead = this.$$nextSibling;
            }
            if (this.$parent && this.$parent.$$childTail === this) {
                this.$parent.$$childTail = this.$$prevSibling;
            }
            elements[this.$id].parentNode.removeChild(elements[this.$id]);
            delete elements[this.$id];
        };
        scopePrototype.$emit = function(evt) {
            var s = this;
            while (s) {
                if (s.$$listeners[evt]) {
                    each(s.$$listeners[evt], evtHandler, arguments);
                }
                s = s.$parent;
            }
        };
        scopePrototype.$broadcast = function(evt) {
            if (this.$$listeners[evt]) {
                each.apply({
                    scope: this
                }, [ this.$$listeners[evt], evtHandler, arguments ]);
            }
            var s = this.$$childHead;
            while (s) {
                s.$broadcast.apply(s, arguments);
                s = s.$$nextSibling;
            }
        };
        scopePrototype.$on = function(evt, fn) {
            var self = this;
            self.$$listeners[evt] = self.$$listeners[evt] || [];
            self.$$listeners[evt].push(fn);
            return function() {
                var ary = self.$$listeners[evt], index = ary.indexOf(fn);
                if (index !== -1) {
                    ary.splice(index, 1);
                }
            };
        };
        scopePrototype.$off = function(evt, fn) {
            var list = this.$$listeners[evt], i = 0, len = list.length;
            while (i < len) {
                if (!fn || fn && list[i] === fn) {
                    list.splice(i, 1);
                    i -= 1;
                    len -= 1;
                }
                i += 1;
            }
        };
        scopePrototype.$watch = function(strOrFn, fn, useDeepWatch) {
            var s = this, watch;
            if (typeof strOrFn === "string") {
                watch = function() {
                    var result = interpolate.exec(s, strOrFn);
                    if (result && result.$$dirty) {
                        delete result.$$dirty;
                        this.$$dirty = true;
                    }
                    return result;
                };
            } else {
                watch = strOrFn;
            }
            s.$$watchers.push(createWatch(s, watch, fn, useDeepWatch));
        };
        scopePrototype.$watchOnce = function(strOrFn, fn, useDeepWatch) {
            return this.$watch(strOrFn, fn, useDeepWatch, true);
        };
        scopePrototype.$eval = function(str) {
            return interpolate.exec(this, str);
        };
        scopePrototype.$apply = function(str) {
            if (str) {
                interpolate.exec(this, str);
            }
            this.$root.$digest();
        };
        scopePrototype.$new = function(isolate) {
            var s = this, ChildScope, child;
            if (isolate) {
                child = new Scope();
            } else {
                ChildScope = function() {};
                ChildScope.prototype = this;
                child = new ChildScope();
                child.$id = uuid();
            }
            child["this"] = child;
            child.$$listeners = {};
            child.$parent = s;
            child.$$watchers = [];
            child.$$handlers = [];
            child.$$nextSibling = child.$$childHead = child.$$childTail = null;
            child.$$prevSibling = s.$$childTail;
            if (s.$$childHead) {
                s.$$childTail.$$nextSibling = child;
                s.$$childTail = child;
            } else {
                s.$$childHead = s.$$childTail = child;
            }
            return child;
        };
        function digest() {
            var dirty, ttl = MAX_DIGESTS;
            this.$$lastDirtyWatch = null;
            do {
                dirty = digestOnce.call(this);
                if (dirty && !ttl--) {
                    throw new Error("app.errors.MESSAGES.E3" + MAX_DIGESTS);
                }
            } while (dirty);
        }
        function digestOnce() {
            var scope = this;
            if (scope.$$phase) {
                return;
            }
            var child = scope.$$childHead, next, dirty = {
                value: false
            };
            scope.$$phase = "digest";
            each(scope.$$watchers, runWatcher, scope, dirty);
            scope.$$phase = null;
            while (child) {
                next = child.$$nextSibling;
                child.$digest.call(child);
                child = next;
            }
            return dirty.value;
        }
        function runWatcher(watcher, index, list, scope, dirty) {
            var newVal = watcher.watchFn(scope), oldVal = watcher.last;
            if (watcher.$$dirty || !areEqual(newVal, oldVal, watcher.useDeepWatch)) {
                delete watcher.$$dirty;
                scope.$$lastDirtyWatch = watcher;
                watcher.last = watcher.useDeepWatch ? JSON.stringify(newVal) : newVal;
                if (watcher.listenerFn) {
                    watcher.listenerFn(newVal, oldVal === initWatchVal ? newVal : oldVal, scope);
                }
                dirty.value = true;
            } else if (scope.$$lastDirtyWatch === watcher) {
                delete scope.$$lastDirtyWatch;
                dirty.value = false;
                return dirty;
            }
        }
        function areEqual(newValue, oldValue, useDeepWatch) {
            if (useDeepWatch) {
                return JSON.stringify(newValue) === oldValue;
            }
            return newValue === oldValue || typeof newValue === "number" && typeof oldValue === "number" && isNaN(newValue) && isNaN(oldValue);
        }
        function createWatch(scope, watch, listen, useDeepWatch, watchOnce) {
            var fn = listen;
            if (watchOnce) {
                fn = function(newVal, oldVal) {
                    listen.call(this, newVal, oldVal);
                    var i = scope.$$listeners.indexOf(fn);
                    if (i !== -1) {
                        scope.$$listeners.splice(i, 1);
                    }
                };
            }
            return {
                watching: watch,
                last: initWatchVal,
                watchFn: watch,
                listenerFn: fn,
                useDeepWatch: !!useDeepWatch
            };
        }
        function initWatchVal() {}
        angular.Scope = Scope;
    })();
    exports["app"] = app;
    exports["helpers"] = helpers;
    exports["formatters"] = formatters;
    exports["Injector"] = Injector;
    exports["Interpolate"] = Interpolate;
    exports["validators"] = validators;
})({}, function() {
    return this;
}());