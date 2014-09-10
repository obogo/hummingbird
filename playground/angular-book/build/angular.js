/*
* angular 0.1.0
* Obogo. MIT 2014
*/
(function(exports, global) {
    global["angular"] = exports;
    var helpers = {};
    helpers.forEach = function(obj, iterator, context) {
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
                for (key = 0, length = obj.length; key < length; key++) {
                    if (iterator.call(context, obj[key], key) === false) {
                        break;
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
        }
        Scope.prototype.$watch = function(watchFn, listenerFn, useDeepWatch) {
            var watcher = {
                watchFn: watchFn,
                listenerFn: listenerFn || function() {},
                useDeepWatch: !!useDeepWatch,
                last: initWatchVal
            };
            this.$$watchers.push(watcher);
        };
        Scope.prototype.$$digestOnce = function() {
            var self = this;
            var newValue, oldValue, dirty;
            forEach(this.$$watchers, function(watcher) {
                newValue = watcher.watchFn(self);
                oldValue = watcher.last;
                if (!self.$$areEqual(newValue, oldValue, watcher.useDeepWatch)) {
                    self.$$lastDirtyWatch = watcher;
                    watcher.last = watcher.useDeepWatch ? JSON.stringify(newValue) : newValue;
                    watcher.listenerFn(newValue, oldValue === initWatchVal ? newValue : oldValue, self);
                    dirty = true;
                } else if (self.$$lastDirtyWatch === watcher) {
                    return false;
                }
            });
            return dirty;
        };
        Scope.prototype.$digest = function() {
            var ttl = 10;
            var dirty;
            this.$$lastDirtyWatch = null;
            do {
                while (this.$$asyncQueue.length) {
                    var asyncTask = this.$$asyncQueue.shift();
                    asyncTask.scope.$eval(asyncTask.expression);
                }
                dirty = this.$$digestOnce();
                if ((dirty || this.$$asyncQueue.length) && !ttl--) {
                    throw "10 digest iterations reached";
                }
            } while (dirty || this.$$asyncQueue.length);
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
                return this.$eval(expr);
            } finally {
                this.$digest();
            }
        };
        Scope.prototype.$evalAsync = function(expr) {
            this.$$asyncQueue.push({
                scope: this,
                expression: expr
            });
        };
        return Scope;
    }();
    exports["helpers"] = helpers;
    exports["validators"] = validators;
    exports["Scope"] = Scope;
})({}, function() {
    return this;
}());