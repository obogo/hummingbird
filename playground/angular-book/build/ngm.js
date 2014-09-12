/*
* ngm 0.1.0
* Obogo. MIT 2014
*/
(function(exports, global) {
    global["ngm"] = exports;
    Array.prototype.isArray = true;
    Object.defineProperty(Array.prototype, "isArray", {
        enumerable: false,
        writable: true
    });
    var validators = {};
    validators.has = function(obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key);
    };
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
    validators.isBoolean = function(val) {
        return typeof val === "boolean";
    };
    validators.isDate = function(val) {
        return val instanceof Date;
    };
    validators.isDefined = function(val) {
        return typeof val !== "undefined";
    };
    validators.isEmail = function(value) {
        var regExp = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9])+$/;
        return regExp.test(value + "");
    };
    validators.isEmpty = function(val) {
        if (_.isString(val)) {
            return val === "";
        }
        if (_.isArray(val)) {
            return val.length === 0;
        }
        if (_.isObject(val)) {
            for (var e in val) {
                return false;
            }
            return true;
        }
        return false;
    };
    validators.isFunction = function(val) {
        return typeof val === "function";
    };
    validators.isInt = function(val) {
        return String(val).search(/^\s*(\-)?\d+\s*$/) !== -1;
    };
    validators.isJson = function(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    };
    validators.isNumber = function(val) {
        return typeof val === "number";
    };
    validators.isNumeric = function(val) {
        return !isNaN(parseFloat(val)) && isFinite(val);
    };
    validators.isObject = function(val) {
        return val !== null && typeof val === "object";
    };
    validators.isRegExp = function(value) {
        return formatters.toString.call(value) === "[object RegExp]";
    };
    validators.isRequired = function(value, message) {
        if (typeof value === "undefined") {
            throw new Error(message || 'The property "' + value + '" is required');
        }
    };
    validators.isString = function isString(val) {
        return typeof val === "string";
    };
    validators.isTrue = function() {
        return {
            operators: [ "eq", "neq", "~eq", "~neq", "gt", "lt", "gte", "lte" ],
            test: function(valA, operator, valB) {
                if (!isNaN(valA) && !isNaN(valB)) {
                    valA = Number(valA);
                    valB = Number(valB);
                } else {
                    valA = valA === undefined ? "" : valA;
                    valB = valB === undefined ? "" : valB;
                }
                switch (operator) {
                  case "eq":
                    return valA + "" === valB + "";

                  case "neq":
                    return valA + "" !== valB + "";

                  case "~eq":
                    return (valA + "").toLowerCase() === (valB + "").toLowerCase();

                  case "~neq":
                    return (valA + "").toLowerCase() !== (valB + "").toLowerCase();

                  case "gt":
                    return valA > valB;

                  case "lt":
                    return valA < valB;

                  case "gte":
                    return valA >= valB;

                  case "lte":
                    return valA <= valB;
                }
            }
        };
    };
    validators.isUndefined = function(val) {
        return typeof val === "undefined";
    };
    validators.isWindow = function(obj) {
        return obj && obj.document && obj.location && obj.alert && obj.setInterval;
    };
    var Collection = function() {
        function Collection(scope) {}
        Collection.prototype.$watchCollection = function(scope, watchFn, listenerFn) {
            var newValue;
            var oldValue;
            var oldLength;
            var veryOldValue;
            var trackVeryOldValue = listenerFn.length > 1;
            var changeCount = 0;
            var firstRun = true;
            var _ = validators;
            var internalWatchFn = function(scope) {
                var newLength, i, bothNaN;
                newValue = watchFn(scope);
                if (_.isObject(newValue)) {
                    if (_.isArrayLike(newValue)) {
                        if (!_.isArray(oldValue)) {
                            changeCount++;
                            oldValue = [];
                        }
                        if (newValue.length !== oldValue.length) {
                            changeCount++;
                            oldValue.length = newValue.length;
                        }
                        var newItem;
                        for (i in newValue) {
                            newItem = newValue[i];
                            bothNaN = isNaN(newItem) && isNaN(oldValue[i]);
                            if (!bothNaN && newItem !== oldValue[i]) {
                                changeCount++;
                                oldValue[i] = newItem;
                            }
                        }
                    } else {
                        if (!_.isObject(oldValue) || _.isArrayLike(oldValue)) {
                            changeCount++;
                            oldValue = {};
                            oldLength = 0;
                        }
                        newLength = 0;
                        var newVal;
                        for (i in newValue) {
                            if (newValue.hasOwnProperty(i)) {
                                newLength++;
                                newVal = newValue[i];
                                if (oldValue.hasOwnProperty(i)) {
                                    bothNaN = isNaN(newVal) && isNaN(oldValue[i]);
                                    if (!bothNaN && oldValue[i] !== newVal) {
                                        changeCount++;
                                        oldValue[i] = newVal;
                                    }
                                } else {
                                    changeCount++;
                                    oldLength++;
                                    oldValue[i] = newVal;
                                }
                            }
                        }
                        if (oldLength > newLength) {
                            changeCount++;
                            var oldVal;
                            for (i in oldValue) {
                                oldVal = oldValue[i];
                                if (!newValue.hasOwnProperty(i)) {
                                    oldLength--;
                                    delete oldValue[i];
                                }
                            }
                        }
                    }
                } else {
                    if (!scope.$$areEqual(newValue, oldValue, false)) {
                        changeCount++;
                    }
                    oldValue = newValue;
                }
                return changeCount;
            };
            var internalListenerFn = function() {
                if (firstRun) {
                    listenerFn(newValue, newValue, scope);
                    firstRun = false;
                } else {
                    listenerFn(newValue, veryOldValue, scope);
                }
                if (trackVeryOldValue) {
                    veryOldValue = JSON.parse(JSON.stringify(newValue));
                }
            };
            return scope.$watch(internalWatchFn, internalListenerFn);
        };
        return Collection;
    }();
    var Scope = function() {
        var prototype = "prototype";
        var err = "error";
        var winConsole = console;
        var counter = 1;
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
        function generateId() {
            return (counter++).toString(36);
        }
        function initWatchVal() {}
        function Scope() {
            var self = this;
            self.$id = generateId();
            self.$w = [];
            self.$lw = null;
            self.$aQ = [];
            self.$pQ = [];
            self.$r = self;
            self.$c = [];
            self.$l = {};
            self.$ph = null;
        }
        var scopePrototype = Scope.prototype;
        scopePrototype.$watch = function(watchFn, listenerFn, deep) {
            var self = this;
            var watcher = {
                watchFn: watchFn,
                listenerFn: listenerFn || function() {},
                deep: !!deep,
                last: initWatchVal
            };
            self.$w.unshift(watcher);
            self.$r.$lw = null;
            self.$lw = null;
            return function() {
                var index = self.$w.indexOf(watcher);
                if (index >= 0) {
                    self.$w.splice(index, 1);
                    self.$r.$lw = null;
                }
            };
        };
        scopePrototype.$$digestOnce = function() {
            var dirty = false;
            var continueLoop = true;
            var self = this;
            self.$$scopes(function(scope) {
                if (scope.$$ignore) {
                    return true;
                }
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
                                scope.$r.$lw = watcher;
                                watcher.last = watcher.deep ? JSON.stringify(newValue) : newValue;
                                watcher.listenerFn(newValue, oldValue === initWatchVal ? newValue : oldValue, scope);
                                dirty = true;
                            } else if (scope.$r.$lw === watcher) {
                                continueLoop = false;
                                return false;
                            }
                        }
                    } catch (e) {
                        winConsole[err](e);
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
            self.$r.$lw = null;
            self.$beginPhase("$digest");
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
                if ((dirty || self.$aQ.length) && !ttl--) {
                    self.$clearPhase();
                    throw "10its";
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
                self.$clearPhase();
                self.$r.$digest();
            }
        };
        scopePrototype.$evalAsync = function(expr) {
            var self = this;
            if (!self.$ph && !self.$aQ.length) {
                setTimeout(function() {
                    if (self.$aQ.length) {
                        self.$r.$digest();
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
            if (self.$ph) {
                return;
            }
            self.$ph = phase;
        };
        scopePrototype.$clearPhase = function() {
            this.$ph = null;
        };
        scopePrototype.$$postDigest = function(fn) {
            this.$pQ.push(fn);
        };
        scopePrototype.$new = function(isolated) {
            var child, self = this;
            if (isolated) {
                child = new Scope();
                child.$r = self.$r;
                child.$aQ = self.$aQ;
                child.$pQ = self.$pQ;
            } else {
                var ChildScope = function() {};
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
        scopePrototype.$ignore = function(value, childrenOnly) {
            var self = this;
            self.$$scopes(function(scope) {
                scope.$$ignore = value;
            });
            if (!childrenOnly) {
                self.$$ignore = value;
            }
        };
        scopePrototype.$$scopes = function(fn) {
            var self = this;
            if (fn(self)) {
                return every(self.$c, function(child) {
                    return child.$$scopes(fn);
                });
            } else {
                return false;
            }
        };
        scopePrototype.$destroy = function() {
            var self = this;
            if (self === self.$r) {
                return;
            }
            var siblings = self.$p.$c;
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
            if (self.$$ignore && self.eventName !== "$destroy") {
                console.log("ignore emit");
                return;
            }
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
                scope = scope.$p;
            } while (scope && !propagationStopped);
            return event;
        };
        scopePrototype.$broadcast = function(eventName) {
            var self = this;
            if (self.$$ignore && self.eventName !== "$destroy") {
                console.log("ignore broadcast");
                return;
            }
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
                        winConsole[err](e);
                    }
                    i++;
                }
            }
            return event;
        };
        return Scope;
    }();
    exports["validators"] = validators;
    exports["Collection"] = Collection;
    exports["Scope"] = Scope;
})({}, function() {
    return this;
}());