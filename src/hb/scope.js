internal('hb.scope', ['hb.errors'], function (errors) {

    /* global utils */
    var prototype = 'prototype';
    var err = 'error';
    var winConsole = console;
    var counter = 1;

    function toArgsArray(args) {
        return Array[prototype].slice.call(args, 0) || [];
    }

    function every(list, fn) {
        var returnVal = true;
        var i = 0, len = list.length;
        while (i < len) {
            if (!fn(list[i])) {
                returnVal = false;
            }
            i += 1;
        }
        return returnVal;
    }

    function generateId() {
        return (counter++).toString(36);
    }

    function initWatchVal() {
    }

    function Scope(interpolate) {
        var self = this;
        self.$id = generateId();
        self.$w = []; // watchers
        self.$lw = null; // lastDirtyWatch
        self.$aQ = []; // asyncQueue
        self.$pQ = []; // postDigestQueue
        self.$r = self; // root
        self.$c = []; // children
        self.$l = {}; // listeners
        self.$ph = null; // phase
        self.$interpolate = interpolate;
    }

    var scopePrototype = Scope.prototype;
    scopePrototype.$watch = function (watchFn, listenerFn, deep) {
        var self = this, watch, watchStr;
        if(!watchFn) {
            return;
        }
        if (typeof watchFn === 'string') {
            watchStr = watchFn;
            watch = function () {
                return self.$interpolate(self, watchFn, true);
            };
        } else {
            watch = watchFn;
        }

        var watcher = {
            expr: watchStr,// very helpful when debugging you can see what it was evaluated from.
            watchFn: watch,
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
        var dirty = false;
        var continueLoop = true;
        var self = this;
        self.$$scopes(function (scope) {
            if (scope.$$ignore) {
                return false;
            }
            var newValue, oldValue;
            var i = scope.$w.length;
            var watcher;
            while (i--) { // reverse
                watcher = scope.$w[i];
                if (watcher) {
                    newValue = watcher.watchFn(scope);
                    oldValue = watcher.last;
                    if (!scope.$$areEqual(newValue, oldValue, watcher.deep) || oldValue === initWatchVal) {
                        scope.$r.$lw = watcher;
                        watcher.last = (watcher.deep ? JSON.stringify(newValue) : newValue);
                        watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), scope);
                        if (oldValue === initWatchVal) {
                            watcher.last = oldValue = undefined;// only have it be initWatchVal the first time.
                        }
                        dirty = true;
                    } else if (scope.$r.$lw === watcher) {
                        continueLoop = false;
                        return false;
                    }
                }
            }
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
                    winConsole[err](e);
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
                winConsole[err](e);
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
        var self = this;
        return self.$interpolate(locals || self, expr, true);
    };

    scopePrototype.$apply = function (expr) {
        var self = this;
        if(!self.$isIgnored()) {
            try {
                self.$beginPhase('$apply');
                if (expr) {
                    return self.$eval(expr);
                }
            } finally {
                self.$clearPhase();
                self.$r.$digest();
            }
        }
    };

    scopePrototype.$evalAsync = function (expr) {
        var self = this;
        if (!self.$ph && !self.$aQ.length) {
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
        if (self.$ph) {
//            throw self.$ph + ' already in progress.';
            return;
        }
        self.$ph = phase;
    };

    scopePrototype.$clearPhase = function () {
        this.$ph = null;
    };

    scopePrototype.$$postDigest = function (fn) {
        this.$pQ.push(fn);
    };

    scopePrototype.$new = function (isolated) {
        var child, self = this;
        if (isolated) {
            child = new Scope(self.$interpolate);
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
        child.$id = generateId();
        child.$w = [];
        child.$l = {};
        child.$c = [];
        child.$p = self;
        return child;
    };

    scopePrototype.$isIgnored = function() {
        var self = this;
        var ignored = self.$$ignore,
            scope = self;
        while(!ignored && scope.$p) {
            scope = scope.$p;
            ignored = scope.$$ignore;
        }
        return !!ignored;
    };

    scopePrototype.$ignore = function (enabled, childrenOnly) {
        var self = this;
        if (enabled !== undefined) {
            every(self.$c, function (scope) {
                scope.$$ignore = enabled;
            });

            if (!childrenOnly) {
                self.$$ignore = enabled;
            }
            if (!enabled && !self.$isIgnored()) {
                self.$digest();
            }
        }
    };

    scopePrototype.$ignoreEvents = function (enabled, childrenOnly) {
        var self = this;
        if (enabled !== undefined) {
            every(self.$c, function (scope) {
                scope.$$ignoreEvents = enabled;
            });

            if (!childrenOnly) {
                self.$$ignoreEvents = enabled;
            }
        }
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
        var siblings = self.$p.$c;
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
        if (self.$$ignoreEvents && self.eventName !== '$destroy') {
            return;
        }
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
        var additionalArgs = toArgsArray(arguments);
        additionalArgs.shift();
        var listenerArgs = [event].concat(additionalArgs);
        var scope = self;
        do {
            event.currentScope = scope;
            scope.$$fire(eventName, listenerArgs);
            scope = scope.$p;
        } while (scope && !propagationStopped);
        return event;
    };

    scopePrototype.$broadcast = function (eventName) {
        var self = this;
        if (self.$$ignoreEvents && self.eventName !== '$destroy') {
            return;
        }
        var event = {
            name: eventName,
            targetScope: self,
            preventDefault: function () {
                event.defaultPrevented = true;
            }
        };
        var additionalArgs = toArgsArray(arguments);
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
//                try {
                listeners[i].apply(null, listenerArgs);
//                } catch (e) {
//                    winConsole[err](e);
//                }
                i++;
            }
        }
        return event;
    };

    return function (interpolate) {
        return new Scope(interpolate);
    };

});
