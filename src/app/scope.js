/* global helpers, validators, formatters */
var Scope = (function () {

    var prototype = 'prototype';
    var err = 'error';
    var $console = console;
    var $counter = 0;

    function toArgsArray(args) {
        return Array[prototype].slice.call(args, 0) || [];
    }

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
        self.$id = ($counter++).toString(36);
        self.$rootScope = self; // root
        self.$children = []; // children
        self.$parent = null; // parent
        self.$$watchers = []; // watchers
        self.$$listeners = {}; //listeners
        self.$$lastDirtyWatch = null; // lastDirtyWatch
        self.$$asyncQ = []; // asyncQueue
        self.$$postDigestQ = []; // postDigestQueue
    }

    var scopePrototype = Scope[prototype];
    scopePrototype.$watch = function (watchFn, listenerFn, deep) {
        var self = this;
        var watcher = {
            watchFn: watchFn,
            listenerFn: listenerFn || function () {
            },
            deep: !!deep,
            last: initWatchVal
        };
        self.$$watchers.unshift(watcher);
        self.$rootScope.$$lastDirtyWatch = null;
        self.$$lastDirtyWatch = null;
        return function () {
            var index = self.$$watchers.indexOf(watcher);
            if (index >= 0) {
                self.$$watchers.splice(index, 1);
                self.$rootScope.$$lastDirtyWatch = null;
            }
        };
    };


    scopePrototype.$$digestOnce = function () {
        var dirty;
        var continueLoop = true;
        var self = this;
        self.$$scopes(function (scope) {
            var newValue, oldValue;
            var i = scope.$$watchers.length;
            var watcher;
            while (i--) { // reverse the array
                watcher = scope.$$watchers[i];
                try {
                    if (watcher) {
                        newValue = watcher.watchFn(scope);
                        oldValue = watcher.last;
                        if (!scope.$$areEqual(newValue, oldValue, watcher.deep)) {
                            scope.$rootScope.$$lastDirtyWatch = watcher;
                            watcher.last = (watcher.deep ? JSON.stringify(newValue) : newValue);
                            watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), scope);
                            dirty = true;
                        } else if (scope.$rootScope.$$lastDirtyWatch === watcher) {
                            continueLoop = false;
                            return false;
                        }
                    }
                } catch (e) {
                    $console[err](e);
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
        self.$rootScope.$$lastDirtyWatch = null;
        self.$beginPhase('$digest');
        do {
            while (self.$$asyncQ.length) {
                try {
                    var asyncTask = self.$$asyncQ.shift();
                    asyncTask.scope.$eval(asyncTask.exp);
                } catch (e) {
                    $console[err](e);
                }
            }

            dirty = self.$$digestOnce();

            if ((dirty || self.$$asyncQ.length) && !(ttl--)) {
                self.$childrenlearPhase();
                throw '10its'; // '10 digest iterations reached'
            }
        } while (dirty || self.$$asyncQ.length);

        while (self.$$postDigestQ.length) {
            try {
                self.$$postDigestQ.shift()();
            } catch (e) {
                $console[err](e);
            }
        }

        self.$childrenlearPhase();
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
            self.$childrenlearPhase();
            self.$rootScope.$digest();
        }
    };

    scopePrototype.$evalAsync = function (expr) {
        var self = this;
        if (!self.$parent && !self.$$asyncQ.length) {
            setTimeout(function () {
                if (self.$$asyncQ.length) {
                    self.$rootScope.$digest();
                }
            }, 0);
        }
        self.$$asyncQ.push({scope: self, exp: expr});
    };

    scopePrototype.$beginPhase = function (phase) {
        var self = this;
        if (self.$parent) {
//            throw self.$parent + ' already in progress.';
            return;
        }
        self.$parent = phase;
    };

    scopePrototype.$childrenlearPhase = function () {
        this.$parent = null;
    };

    scopePrototype.$$postDigest = function (fn) {
        this.$$postDigestQ.push(fn);
    };

    scopePrototype.$new = function (isolated) {
        var child, self = this;
        if (isolated) {
            child = new Scope();
            child.$rootScope = self.$rootScope;
            child.$$asyncQ = self.$$asyncQ;
            child.$$postDigestQ = self.$$postDigestQ;
        } else {
            var ChildScope = function () {
            };
            ChildScope.prototype = self;
            child = new ChildScope();
        }
        self.$children.push(child);
        child.$$watchers = [];
        child.$$listeners = {};
        child.$children = [];
        child.$parent = self;
        return child;
    };

    scopePrototype.$$scopes = function (fn) {
        var self = this;
        if (fn(self)) {
            return every(self.$children, function (child) {
                return child.$$scopes(fn);
            });
        } else {
            return false;
        }
    };

    scopePrototype.$destroy = function () {
        var self = this;
        if (self === self.$rootScope) {
            return;
        }
        var siblings = self.$parent.$children;
        var indexOfThis = siblings.indexOf(self);
        if (indexOfThis >= 0) {
            self.$broadcast('$destroy');
            siblings.splice(indexOfThis, 1);
        }
    };

    scopePrototype.$on = function (eventName, listener) {
        var self = this;
        var listeners = self.$$listeners[eventName];
        if (!listeners) {
            self.$$listeners[eventName] = listeners = [];
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
        var additionalArgs = toArgsArray(arguments);
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
        var listeners = this.$$listeners[eventName] || [];
        var i = 0;
        while (i < listeners.length) {
            if (listeners[i] === null) {
                listeners.splice(i, 1);
            } else {
                try {
                    listeners[i].apply(null, listenerArgs);
                } catch (e) {
                    $console[err](e);
                }
                i++;
            }
        }
        return event;
    };

    return Scope;

})();