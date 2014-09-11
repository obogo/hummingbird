/*
* go 0.1.0
* Obogo. MIT 2014
*/
(function(exports, global) {
    global["go"] = exports;
    var Scope = function() {
        var prototype = "prototype";
        var err = "error";
        var $childrenonsole = console;
        var $childrenounter = 0;
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
        function initWatchVal() {}
        function Scope() {
            var self = this;
            self.$id = ($childrenounter++).toString(16);
            self.$w = [];
            self.$l = {};
            self.$lw = null;
            self.$aQ = [];
            self.$pQ = [];
            self.$rootScope = self;
            self.$children = [];
            self.$parent = null;
        }
        var scopePrototype = Scope[prototype];
        scopePrototype.$watch = function(watchFn, listenerFn, deep) {
            var self = this;
            var watcher = {
                watchFn: watchFn,
                listenerFn: listenerFn || function() {},
                deep: !!deep,
                last: initWatchVal
            };
            self.$w.unshift(watcher);
            self.$rootScope.$lw = null;
            self.$lw = null;
            return function() {
                var index = self.$w.indexOf(watcher);
                if (index >= 0) {
                    self.$w.splice(index, 1);
                    self.$rootScope.$lw = null;
                }
            };
        };
        scopePrototype.$$digestOnce = function() {
            var dirty;
            var continueLoop = true;
            var self = this;
            self.$$scopes(function(scope) {
                var newValue, oldValue;
                var i = scope.$w.length;
                var watcher;
                while (i--) {
                    watcher = scope.$w[i];
                    try {
                        if (watcher) {
                            newValue = watcher.watchFn(scope);
                            oldValue = watcher.last;
                            if (!scope.$$areEqual(newValue, oldValue, watcher.deep)) {
                                scope.$rootScope.$lw = watcher;
                                watcher.last = watcher.deep ? JSON.stringify(newValue) : newValue;
                                watcher.listenerFn(newValue, oldValue === initWatchVal ? newValue : oldValue, scope);
                                dirty = true;
                            } else if (scope.$rootScope.$lw === watcher) {
                                continueLoop = false;
                                return false;
                            }
                        }
                    } catch (e) {
                        $childrenonsole[err](e);
                    }
                }
                return continueLoop;
            });
            return dirty;
        };
        scopePrototype.$digest = function() {
            var ttl = 10;
            var dirty;
            var self = this;
            self.$rootScope.$lw = null;
            self.$beginPhase("$digest");
            do {
                while (self.$aQ.length) {
                    try {
                        var asyncTask = self.$aQ.shift();
                        asyncTask.scope.$eval(asyncTask.exp);
                    } catch (e) {
                        $childrenonsole[err](e);
                    }
                }
                dirty = self.$$digestOnce();
                if ((dirty || self.$aQ.length) && !ttl--) {
                    self.$childrenlearPhase();
                    throw "10its";
                }
            } while (dirty || self.$aQ.length);
            while (self.$pQ.length) {
                try {
                    self.$pQ.shift()();
                } catch (e) {
                    $childrenonsole[err](e);
                }
            }
            self.$childrenlearPhase();
        };
        scopePrototype.$$areEqual = function(newValue, oldValue, deep) {
            if (deep) {
                return JSON.stringify(newValue) === oldValue;
            }
            return newValue === oldValue || typeof newValue === "number" && typeof oldValue === "number" && isNaN(newValue) && isNaN(oldValue);
        };
        scopePrototype.$eval = function(expr, locals) {
            return expr(this, locals);
        };
        scopePrototype.$apply = function(expr) {
            var self = this;
            try {
                self.$beginPhase("$apply");
                return self.$eval(expr);
            } finally {
                self.$childrenlearPhase();
                self.$rootScope.$digest();
            }
        };
        scopePrototype.$evalAsync = function(expr) {
            var self = this;
            if (!self.$parent && !self.$aQ.length) {
                setTimeout(function() {
                    if (self.$aQ.length) {
                        self.$rootScope.$digest();
                    }
                }, 0);
            }
            self.$aQ.push({
                scope: self,
                exp: expr
            });
        };
        scopePrototype.$beginPhase = function(phase) {
            var self = this;
            if (self.$parent) {
                return;
            }
            self.$parent = phase;
        };
        scopePrototype.$childrenlearPhase = function() {
            this.$parent = null;
        };
        scopePrototype.$$postDigest = function(fn) {
            this.$pQ.push(fn);
        };
        scopePrototype.$new = function(isolated) {
            var child, self = this;
            if (isolated) {
                child = new Scope();
                child.$rootScope = self.$rootScope;
                child.$aQ = self.$aQ;
                child.$pQ = self.$pQ;
            } else {
                var ChildScope = function() {};
                ChildScope.prototype = self;
                child = new ChildScope();
            }
            self.$children.push(child);
            child.$w = [];
            child.$l = {};
            child.$children = [];
            child.$parent = self;
            return child;
        };
        scopePrototype.$$scopes = function(fn) {
            var self = this;
            if (fn(self)) {
                return every(self.$children, function(child) {
                    return child.$$scopes(fn);
                });
            } else {
                return false;
            }
        };
        scopePrototype.$destroy = function() {
            var self = this;
            if (self === self.$rootScope) {
                return;
            }
            var siblings = self.$parent.$children;
            var indexOfThis = siblings.indexOf(self);
            if (indexOfThis >= 0) {
                self.$broadcast("$destroy");
                siblings.splice(indexOfThis, 1);
            }
        };
        scopePrototype.$on = function(eventName, listener) {
            var self = this;
            var listeners = self.$l[eventName];
            if (!listeners) {
                self.$l[eventName] = listeners = [];
            }
            listeners.push(listener);
            return function() {
                var index = listeners.indexOf(listener);
                if (index >= 0) {
                    listeners[index] = null;
                }
            };
        };
        scopePrototype.$emit = function(eventName) {
            var self = this;
            var propagationStopped = false;
            var event = {
                name: eventName,
                targetScope: self,
                stopPropagation: function() {
                    propagationStopped = true;
                },
                preventDefault: function() {
                    event.defaultPrevented = true;
                }
            };
            var additionalArgs = toArgsArray(arguments);
            additionalArgs.shift();
            var listenerArgs = [ event ].concat(additionalArgs);
            var scope = self;
            do {
                event.currentScope = scope;
                scope.$$fire(eventName, listenerArgs);
                scope = scope.$parent;
            } while (scope && !propagationStopped);
            return event;
        };
        scopePrototype.$broadcast = function(eventName) {
            var self = this;
            var event = {
                name: eventName,
                targetScope: self,
                preventDefault: function() {
                    event.defaultPrevented = true;
                }
            };
            var additionalArgs = toArgsArray(arguments);
            additionalArgs.shift();
            var listenerArgs = [ event ].concat(additionalArgs);
            self.$$scopes(function(scope) {
                event.currentScope = scope;
                scope.$$fire(eventName, listenerArgs);
                return true;
            });
            return event;
        };
        scopePrototype.$$fire = function(eventName, listenerArgs) {
            var listeners = this.$l[eventName] || [];
            var i = 0;
            while (i < listeners.length) {
                if (listeners[i] === null) {
                    listeners.splice(i, 1);
                } else {
                    try {
                        listeners[i].apply(null, listenerArgs);
                    } catch (e) {
                        $childrenonsole[err](e);
                    }
                    i++;
                }
            }
            return event;
        };
        return Scope;
    }();
    exports["Scope"] = Scope;
})({}, function() {
    return this;
}());