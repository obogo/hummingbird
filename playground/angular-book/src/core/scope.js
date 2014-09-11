/* global helpers, validators, formatters */
var Scope = (function () {
    'use strict';

    var forEach = helpers.forEach;

    function initWatchVal() {
    }

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

    Scope.prototype.$watch = function (watchFn, listenerFn, useDeepWatch) {
        var self = this;
        var watcher = {
            watchFn: watchFn,
            listenerFn: listenerFn || function () {
            },
            useDeepWatch: !!useDeepWatch,
            last: initWatchVal
        };
        this.$$watchers.unshift(watcher);
        this.$$root.$$lastDirtyWatch = null;
        this.$$lastDirtyWatch = null;
        return function () {
            var index = self.$$watchers.indexOf(watcher);
            if (index >= 0) {
                self.$$watchers.splice(index, 1);
                self.$$root.$$lastDirtyWatch = null;
            }
        };
    };


    Scope.prototype.$$digestOnce = function () {
        var dirty;
        var continueLoop = true;
        var self = this;
        var reverse = true;
        this.$$everyScope(function (scope) {
            var newValue, oldValue;
            forEach(scope.$$watchers, function (watcher) {
                try {
                    if (watcher) {
                        newValue = watcher.watchFn(scope);
                        oldValue = watcher.last;
                        if (!scope.$$areEqual(newValue, oldValue, watcher.useDeepWatch)) {
                            scope.$$root.$$lastDirtyWatch = watcher;
                            watcher.last = (watcher.useDeepWatch ? JSON.stringify(newValue) : newValue);
                            watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), scope);
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

    Scope.prototype.$digest = function () {
        var ttl = 10;
        var dirty;
        this.$$root.$$lastDirtyWatch = null;
        this.$beginPhase('$digest');
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

            if ((dirty || this.$$asyncQueue.length) && !(ttl--)) {
                this.$clearPhase();
                throw '10 digest iterations reached';
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

    Scope.prototype.$$areEqual = function (newValue, oldValue, useDeepWatch) {
        if (useDeepWatch) {
            return JSON.stringify(newValue) === oldValue;
        }
        return newValue === oldValue ||
            (typeof newValue === 'number' && typeof oldValue === 'number' &&
                isNaN(newValue) && isNaN(oldValue));
    };

    Scope.prototype.$eval = function (expr, locals) {
        return expr(this, locals);
    };

    Scope.prototype.$apply = function (expr) {
        try {
            this.$beginPhase('$apply');
            return this.$eval(expr);
        } finally {
            this.$clearPhase();
            this.$$root.$digest();
        }
    };

    Scope.prototype.$evalAsync = function (expr) {
        var self = this;
        if (!self.$$phase && !self.$$asyncQueue.length) {
            setTimeout(function () {
                if (self.$$asyncQueue.length) {
                    self.$$root.$digest();
                }
            }, 0);
        }
        self.$$asyncQueue.push({scope: this, expression: expr});
    };

    Scope.prototype.$beginPhase = function (phase) {
        if (this.$$phase) {
            throw this.$$phase + ' already in progress.';

        }
        this.$$phase = phase;
    };

    Scope.prototype.$clearPhase = function () {
        this.$$phase = null;
    };

    Scope.prototype.$$postDigest = function (fn) {
        this.$$postDigestQueue.push(fn);
    };

    Scope.prototype.$new = function (isolated) {
        var child;
        if (isolated) {
            child = new Scope();
            child.$$root = this.$$root;
            child.$$asyncQueue = this.$$asyncQueue;
            child.$$postDigestQueue = this.$$postDigestQueue;
        } else {
            var ChildScope = function () {
            };
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

//    Scope.prototype.$$everyScope = function (fn) {
//        if (fn(this)) {
//            var $$children = this.$$children;
//            var i = 0, len = $$children.length, returnVal = true;
//            while (i < len) {
//                returnVal = $$children[i].$$everyScope(fn);
//                i += 1;
//                if (!returnVal) {
//                    continue;
//                }
//            }
//            return returnVal;
//        }
//        return false;
//    };

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

    Scope.prototype.$$everyScope = function (fn) {
        if (fn(this)) {
            return every(this.$$children, function (child) {
                return child.$$everyScope(fn);
            });
        } else {
            return false;
        }
    };

//    Scope.prototype.$$everyScope = function (fn) {
//        if (fn(this)) {
//            var $$children = this.$$children;
//            var i = 0, len = $$children.length, returnVal = true;
//            console.log('CHILLINS', len);
//            while (i < len) {
//                returnVal = $$children[i].$$everyScope(fn);
//                if (!returnVal) {
//                    return returnVal;
//                }
//                i += 1;
//            }
//        }
//        return false;
//    };

    Scope.prototype.$destroy = function () {
        if (this === this.$$root) {
            return;
        }
        var siblings = this.$parent.$$children;
        var indexOfThis = siblings.indexOf(this);
        if (indexOfThis >= 0) {
            siblings.splice(indexOfThis, 1);
        }
    };

    Scope.prototype.$on = function (eventName, listener) {
        var listeners = this.$$listeners[eventName];
        if (!listeners) {
            this.$$listeners[eventName] = listeners = [];
        }
        listeners.push(listener);
        return function () {
            var index = listeners.indexOf(listener);
            if (index >= 0) {
                listeners[index] = null;
            }
        };
    };

    Scope.prototype.$emit = function (eventName) {
        var event = { name: eventName };
        var additionalArgs = formatters.toArgsArray(arguments);
        additionalArgs.shift();
        var listenerArgs = [event].concat(additionalArgs);
        var scope = this;
        do {
            scope.$$fireEventOnScope(eventName, listenerArgs);
            scope = scope.$parent;
        } while (scope);
        return event;
    };

    Scope.prototype.$broadcast = function (eventName) {
        var event = { name: eventName };
        var additionalArgs = formatters.toArgsArray(arguments);
        additionalArgs.shift();
        var listenerArgs = [event].concat(additionalArgs);
        this.$$everyScope(function (scope) {
            scope.$$fireEventOnScope(eventName, listenerArgs);
            return true;
        });
        return event;
    };

    Scope.prototype.$$fireEventOnScope = function (eventName, listenerArgs) {
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

})();