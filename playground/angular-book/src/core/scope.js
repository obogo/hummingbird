/* global helpers, validators */
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
        child.$$children = [];
        child.$parent = this;
        return child;
    };

    Scope.prototype.$$everyScope = function (fn) {
        if (fn(this)) {
            var $$children = this.$$children;
            var i = 0, len = $$children.length, returnVal = true;
            while (i < len) {
                returnVal = $$children[i].$$everyScope(fn);
                if (!returnVal) {
                    return returnVal;
                }
                i += 1;
            }
        }
        return false;
    };

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

    return Scope;
})();