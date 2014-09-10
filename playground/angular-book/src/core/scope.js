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
        this.$$lastDirtyWatch = null;
        return function () {
            var index = self.$$watchers.indexOf(watcher);
            if (index >= 0) {
                self.$$watchers.splice(index, 1);
                self.$$lastDirtyWatch = null;
            }
        };
    };


    Scope.prototype.$$digestOnce = function () {
        var self = this;
        var newValue, oldValue, dirty;
//        var $$watchers = self.$$watchers.slice().reverse();
        forEach(self.$$watchers, function (watcher) {
            try {
                if (watcher) {
                    newValue = watcher.watchFn(self);
                    oldValue = watcher.last;
                    if (!self.$$areEqual(newValue, oldValue, watcher.useDeepWatch)) {
                        self.$$lastDirtyWatch = watcher;
                        watcher.last = (watcher.useDeepWatch ? JSON.stringify(newValue) : newValue);
                        watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), self);
                        dirty = true;
                    } else if (self.$$lastDirtyWatch === watcher) {
                        return false;
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }, null, true);
        return dirty;
    };

    Scope.prototype.$digest = function () {
        var ttl = 10;
        var dirty;
        this.$$lastDirtyWatch = null;
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
            this.$digest();
        }
    };

    Scope.prototype.$evalAsync = function (expr) {
        var self = this;
        if (!self.$$phase && !self.$$asyncQueue.length) {
            setTimeout(function () {
                if (self.$$asyncQueue.length) {
                    self.$digest();
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

    Scope.prototype.$new = function () {
        var ChildScope = function () {
        };
        ChildScope.prototype = this;
        var child = new ChildScope();
        this.$$children.push(child);
        child.$$watchers = [];
        child.$$children = [];
        return child;
    };

    Scope.prototype.$$everyScope = function (fn) {
        if (fn(this)) {
            return this.$$children.every(function (child) {
                return child.$$everyScope(fn);
            });
        } else {
            return false;
        }
    };

    return Scope;
})();