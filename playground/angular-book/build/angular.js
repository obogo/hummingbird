/*
* angular 0.1.0
* Obogo. MIT 2014
*/
(function(exports, global) {
    global["angular"] = exports;
    var formatters = {};
    formatters.toArgsArray = function(args) {
        return Array.prototype.slice.call(args, 0) || [];
    };
    var helpers = {};
    helpers.forEach = function(obj, iterator, context, reverse) {
        var key, length, returnVal;
        if (obj) {
            if (validators.isFunction(obj)) {
                for (key in obj) {
                    if (key !== "prototype" && key !== "length" && key !== "name" && (!obj.hasOwnProperty || obj.hasOwnProperty(key))) {
                        if (iterator.call(context, obj[key], key) === false) {
                            break;
                        }
                    }
                }
            } else if (validators.isArray(obj) || validators.isArrayLike(obj)) {
                if (reverse) {
                    for (key = obj.length - 1, length = 0; key >= length; key--) {
                        if (iterator.call(context, obj[key], key) === false) {
                            break;
                        }
                    }
                } else {
                    for (key = 0, length = obj.length; key < length; key++) {
                        if (iterator.call(context, obj[key], key) === false) {
                            break;
                        }
                    }
                }
            } else if (obj.forEach && obj.forEach !== helpers.forEach) {
                return obj.forEach(iterator, context);
            } else {
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (iterator.call(context, obj[key], key) === false) {
                            break;
                        }
                    }
                }
            }
        }
        return obj;
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
    var Scope = function() {
        "use strict";
        var forEach = helpers.forEach;
        function initWatchVal() {}
        function Scope() {
            this.$$watchers = [];
            this.$$lastDirtyWatch = null;
            this.$$asyncQueue = [];
            this.$$postDigestQueue = [];
            this.$$root = this;
            this.$$children = [];
            this.$$listeners = {};
            this.$$phase = null;
        }
        Scope.prototype.$watch = function(watchFn, listenerFn, useDeepWatch) {
            var self = this;
            var watcher = {
                watchFn: watchFn,
                listenerFn: listenerFn || function() {},
                useDeepWatch: !!useDeepWatch,
                last: initWatchVal
            };
            this.$$watchers.unshift(watcher);
            this.$$root.$$lastDirtyWatch = null;
            this.$$lastDirtyWatch = null;
            return function() {
                var index = self.$$watchers.indexOf(watcher);
                if (index >= 0) {
                    self.$$watchers.splice(index, 1);
                    self.$$root.$$lastDirtyWatch = null;
                }
            };
        };
        Scope.prototype.$$digestOnce = function() {
            var dirty;
            var continueLoop = true;
            var self = this;
            var reverse = true;
            this.$$everyScope(function(scope) {
                var newValue, oldValue;
                forEach(scope.$$watchers, function(watcher) {
                    try {
                        if (watcher) {
                            newValue = watcher.watchFn(scope);
                            oldValue = watcher.last;
                            if (!scope.$$areEqual(newValue, oldValue, watcher.useDeepWatch)) {
                                scope.$$root.$$lastDirtyWatch = watcher;
                                watcher.last = watcher.useDeepWatch ? JSON.stringify(newValue) : newValue;
                                watcher.listenerFn(newValue, oldValue === initWatchVal ? newValue : oldValue, scope);
                                dirty = true;
                            } else if (scope.$$root.$$lastDirtyWatch === watcher) {
                                continueLoop = false;
                                return false;
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }, null, reverse);
                return continueLoop;
            });
            return dirty;
        };
        Scope.prototype.$digest = function() {
            var ttl = 10;
            var dirty;
            this.$$root.$$lastDirtyWatch = null;
            this.$beginPhase("$digest");
            do {
                while (this.$$asyncQueue.length) {
                    try {
                        var asyncTask = this.$$asyncQueue.shift();
                        asyncTask.scope.$eval(asyncTask.expression);
                    } catch (e) {
                        console.error(e);
                    }
                }
                dirty = this.$$digestOnce();
                if ((dirty || this.$$asyncQueue.length) && !ttl--) {
                    this.$clearPhase();
                    throw "10 digest iterations reached";
                }
            } while (dirty || this.$$asyncQueue.length);
            while (this.$$postDigestQueue.length) {
                try {
                    this.$$postDigestQueue.shift()();
                } catch (e) {
                    console.error(e);
                }
            }
            this.$clearPhase();
        };
        Scope.prototype.$$areEqual = function(newValue, oldValue, useDeepWatch) {
            if (useDeepWatch) {
                return JSON.stringify(newValue) === oldValue;
            }
            return newValue === oldValue || typeof newValue === "number" && typeof oldValue === "number" && isNaN(newValue) && isNaN(oldValue);
        };
        Scope.prototype.$eval = function(expr, locals) {
            return expr(this, locals);
        };
        Scope.prototype.$apply = function(expr) {
            try {
                this.$beginPhase("$apply");
                return this.$eval(expr);
            } finally {
                this.$clearPhase();
                this.$$root.$digest();
            }
        };
        Scope.prototype.$evalAsync = function(expr) {
            var self = this;
            if (!self.$$phase && !self.$$asyncQueue.length) {
                setTimeout(function() {
                    if (self.$$asyncQueue.length) {
                        self.$$root.$digest();
                    }
                }, 0);
            }
            self.$$asyncQueue.push({
                scope: this,
                expression: expr
            });
        };
        Scope.prototype.$beginPhase = function(phase) {
            if (this.$$phase) {
                throw this.$$phase + " already in progress.";
            }
            this.$$phase = phase;
        };
        Scope.prototype.$clearPhase = function() {
            this.$$phase = null;
        };
        Scope.prototype.$$postDigest = function(fn) {
            this.$$postDigestQueue.push(fn);
        };
        Scope.prototype.$new = function(isolated) {
            var child;
            if (isolated) {
                child = new Scope();
                child.$$root = this.$$root;
                child.$$asyncQueue = this.$$asyncQueue;
                child.$$postDigestQueue = this.$$postDigestQueue;
            } else {
                var ChildScope = function() {};
                ChildScope.prototype = this;
                child = new ChildScope();
            }
            this.$$children.push(child);
            child.$$watchers = [];
            child.$$listeners = {};
            child.$$children = [];
            child.$parent = this;
            return child;
        };
        function every(list, predicate) {
            var returnVal = true;
            var i = 0, len = list.length;
            while (i < len) {
                if (!predicate(list[i])) {
                    returnVal = false;
                }
                i += 1;
            }
            return returnVal;
        }
        Scope.prototype.$$everyScope = function(fn) {
            if (fn(this)) {
                return every(this.$$children, function(child) {
                    return child.$$everyScope(fn);
                });
            } else {
                return false;
            }
        };
        Scope.prototype.$destroy = function() {
            if (this === this.$$root) {
                return;
            }
            var siblings = this.$parent.$$children;
            var indexOfThis = siblings.indexOf(this);
            if (indexOfThis >= 0) {
                siblings.splice(indexOfThis, 1);
            }
        };
        Scope.prototype.$on = function(eventName, listener) {
            var listeners = this.$$listeners[eventName];
            if (!listeners) {
                this.$$listeners[eventName] = listeners = [];
            }
            listeners.push(listener);
            return function() {
                var index = listeners.indexOf(listener);
                if (index >= 0) {
                    listeners[index] = null;
                }
            };
        };
        Scope.prototype.$emit = function(eventName) {
            var propagationStopped = false;
            var event = {
                name: eventName,
                targetScope: this,
                stopPropagation: function() {
                    propagationStopped = true;
                }
            };
            var additionalArgs = formatters.toArgsArray(arguments);
            additionalArgs.shift();
            var listenerArgs = [ event ].concat(additionalArgs);
            var scope = this;
            do {
                event.currentScope = scope;
                scope.$$fireEventOnScope(eventName, listenerArgs);
                scope = scope.$parent;
            } while (scope && !propagationStopped);
            return event;
        };
        Scope.prototype.$broadcast = function(eventName) {
            var event = {
                name: eventName,
                targetScope: this
            };
            var additionalArgs = formatters.toArgsArray(arguments);
            additionalArgs.shift();
            var listenerArgs = [ event ].concat(additionalArgs);
            this.$$everyScope(function(scope) {
                event.currentScope = scope;
                scope.$$fireEventOnScope(eventName, listenerArgs);
                return true;
            });
            return event;
        };
        Scope.prototype.$$fireEventOnScope = function(eventName, listenerArgs) {
            var listeners = this.$$listeners[eventName] || [];
            var i = 0;
            while (i < listeners.length) {
                if (listeners[i] === null) {
                    listeners.splice(i, 1);
                } else {
                    try {
                        listeners[i].apply(null, listenerArgs);
                    } catch (e) {
                        console.error(e);
                    }
                    i++;
                }
            }
            return event;
        };
        return Scope;
    }();
    exports["formatters"] = formatters;
    exports["helpers"] = helpers;
    exports["validators"] = validators;
    exports["Scope"] = Scope;
})({}, function() {
    return this;
}());