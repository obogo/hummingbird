/* global helpers, validators */
var Scope = (function () {
    'use strict';

    var forEach = helpers.forEach;

    function initWatchVal() {
    }

    function Scope() {
        this.$$watchers = [];
        this.$$lastDirtyWatch = null;
    }

    Scope.prototype.$watch = function (watchFn, listenerFn, useDeepWatch) {
        var watcher = {
            watchFn: watchFn,
            listenerFn: listenerFn || function () {
            },
            useDeepWatch: !!useDeepWatch,
            last: initWatchVal
        };
        this.$$watchers.push(watcher);
    };


    Scope.prototype.$$digestOnce = function () {
        var self = this;
        var newValue, oldValue, dirty;
        forEach(this.$$watchers, function (watcher) {
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
        });
        return dirty;
    };

    Scope.prototype.$digest = function () {
        var ttl = 10;
        var dirty;
        this.$$lastDirtyWatch = null;
        do {
            dirty = this.$$digestOnce();
            if (dirty && !(ttl--)) {
                throw "10 digest iterations reached";
            }
        } while (dirty);
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
        console.log('$eval called');
        return undefined;
//        return expr(this, locals);
    };

    return Scope;
})();