/* global helpers, validators, formatters */
var Scope = (function () {
    var forEach = helpers.forEach;

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

    function initWatchVal() {
    }

    function Scope() {
        var self = this;
        self.$w = []; // watchers
        self.$lw = null; // lastDirtyWatch
        self.$aQ = []; // asyncQueue
        self.$pQ = []; // postDigestQueue
        self.$r = self; // root
        self.$c = []; // children
        self.$l = {};
        self.$p = null;
    }

    var scopePrototype = Scope.prototype;
    scopePrototype.$watch = function (watchFn, listenerFn, deep) {
        var self = this;
        var watcher = {
            watchFn: watchFn,
            listenerFn: listenerFn || function () {
            },
            deep: !!deep,
            last: initWatchVal
        };
        self.$w.unshift(watcher);
        self.$r.$lw = null;
        self.$lw = null;
        return function () {
            var index = self.$w.indexOf(watcher);
            if (index >= 0) {
                self.$w.splice(index, 1);
                self.$r.$lw = null;
            }
        };
    };


    scopePrototype.$$digestOnce = function () {
        var dirty;
        var continueLoop = true;
        var self = this;
        var reverse = true;
        self.$$scopes(function (scope) {
            var newValue, oldValue;
            forEach(scope.$w, function (watcher) {
                try {
                    if (watcher) {
                        newValue = watcher.watchFn(scope);
                        oldValue = watcher.last;
                        if (!scope.$$areEqual(newValue, oldValue, watcher.deep)) {
                            scope.$r.$lw = watcher;
                            watcher.last = (watcher.deep ? JSON.stringify(newValue) : newValue);
                            watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), scope);
                            dirty = true;
                        } else if (scope.$r.$lw === watcher) {
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

    scopePrototype.$digest = function () {
        var ttl = 10;
        var dirty;
        var self = this;
        self.$r.$lw = null;
        self.$beginPhase('$digest');
        do {
            while (self.$aQ.length) {
                try {
                    var asyncTask = self.$aQ.shift();
                    asyncTask.scope.$eval(asyncTask.exp);
                } catch (e) {
                    console.error(e);
                }
            }

            dirty = self.$$digestOnce();

            if ((dirty || self.$aQ.length) && !(ttl--)) {
                self.$clearPhase();
                throw '10its'; // '10 digest iterations reached'
            }
        } while (dirty || self.$aQ.length);

        while (self.$pQ.length) {
            try {
                self.$pQ.shift()();
            } catch (e) {
                console.error(e);
            }
        }

        self.$clearPhase();
    };

    scopePrototype.$$areEqual = function (newValue, oldValue, deep) {
        if (deep) {
            return JSON.stringify(newValue) === oldValue;
        }
        return newValue === oldValue ||
            (typeof newValue === 'number' && typeof oldValue === 'number' &&
                isNaN(newValue) && isNaN(oldValue));
    };

    scopePrototype.$eval = function (expr, locals) {
        return expr(this, locals);
    };

    scopePrototype.$apply = function (expr) {
        var self = this;
        try {
            self.$beginPhase('$apply');
            return self.$eval(expr);
        } finally {
            self.$clearPhase();
            self.$r.$digest();
        }
    };

    scopePrototype.$evalAsync = function (expr) {
        var self = this;
        if (!self.$p && !self.$aQ.length) {
            setTimeout(function () {
                if (self.$aQ.length) {
                    self.$r.$digest();
                }
            }, 0);
        }
        self.$aQ.push({scope: self, exp: expr});
    };

    scopePrototype.$beginPhase = function (phase) {
        var self = this;
        if (self.$p) {
//            throw self.$p + ' already in progress.';
            return;
        }
        self.$p = phase;
    };

    scopePrototype.$clearPhase = function () {
        this.$p = null;
    };

    scopePrototype.$$postDigest = function (fn) {
        this.$pQ.push(fn);
    };

    scopePrototype.$new = function (isolated) {
        var child, self = this;
        if (isolated) {
            child = new Scope();
            child.$r = self.$r;
            child.$aQ = self.$aQ;
            child.$pQ = self.$pQ;
        } else {
            var ChildScope = function () {
            };
            ChildScope.prototype = self;
            child = new ChildScope();
        }
        self.$c.push(child);
        child.$w = [];
        child.$l = {};
        child.$c = [];
        child.$parent = self;
        return child;
    };

    scopePrototype.$$scopes = function (fn) {
        var self = this;
        if (fn(self)) {
            return every(self.$c, function (child) {
                return child.$$scopes(fn);
            });
        } else {
            return false;
        }
    };

    scopePrototype.$destroy = function () {
        var self = this;
        if (self === self.$r) {
            return;
        }
        var siblings = self.$parent.$c;
        var indexOfThis = siblings.indexOf(self);
        if (indexOfThis >= 0) {
            self.$broadcast('$destroy');
            siblings.splice(indexOfThis, 1);
        }
    };

    scopePrototype.$on = function (eventName, listener) {
        var self = this;
        var listeners = self.$l[eventName];
        if (!listeners) {
            self.$l[eventName] = listeners = [];
        }
        listeners.push(listener);
        return function () {
            var index = listeners.indexOf(listener);
            if (index >= 0) {
                listeners[index] = null;
            }
        };
    };

    scopePrototype.$emit = function (eventName) {
        var self = this;
        var propagationStopped = false;
        var event = {
            name: eventName,
            targetScope: self,
            stopPropagation: function () {
                propagationStopped = true;
            },
            preventDefault: function () {
                event.defaultPrevented = true;
            }
        };
        var additionalArgs = formatters.toArgsArray(arguments);
        additionalArgs.shift();
        var listenerArgs = [event].concat(additionalArgs);
        var scope = self;
        do {
            event.currentScope = scope;
            scope.$$fire(eventName, listenerArgs);
            scope = scope.$parent;
        } while (scope && !propagationStopped);
        return event;
    };

    scopePrototype.$broadcast = function (eventName) {
        var self = this;
        var event = {
            name: eventName,
            targetScope: self,
            preventDefault: function () {
                event.defaultPrevented = true;
            }
        };
        var additionalArgs = formatters.toArgsArray(arguments);
        additionalArgs.shift();
        var listenerArgs = [event].concat(additionalArgs);
        self.$$scopes(function (scope) {
            event.currentScope = scope;
            scope.$$fire(eventName, listenerArgs);
            return true;
        });
        return event;
    };

    scopePrototype.$$fire = function (eventName, listenerArgs) {
        var listeners = this.$l[eventName] || [];
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