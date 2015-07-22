internal('hb.scope', ['hb.debug', 'apply'], function (debug, apply) {

    var DESTROY = '$destroy';
    var EMIT = '$emit';
    var BROADCAST = '$broadcast';

    /* global utils */
    var prototype = 'prototype';
    var err = 'error';
    var winConsole = console;
    var counter = 0;
    var watchCounter = 0;
    var destroying = {};
    var unwatching = [];
    var watchers = {};

    var db = debug.register('scope');
    var scopeCountStat = db.stat('scope count');
    var watchCount = db.stat('watch count');
    var digestStat = db.stat('$digest');
    var ignoreStat = db.stat('$ignore', '#CCC');

    var intv;
    var intvMax = 10;// only destroy 10 watchers per sec.

    function toArgsArray(args) {
        return Array[prototype].slice.call(args, 0) || [];
    }

    //TODO: these return values are not being used. simplify.
    function every(list, fn) {
        var returnVal = false;
        var i = 0, len = list.length;
        while (i < len) {
            if (fn(list[i])) {
                returnVal = true;// if any of them are false. return false.
            }
            i += 1;
        }
        return returnVal;
    }

    function isEqual(newValue, oldValue, deep) {
        if (deep) {
            return JSON.stringify(newValue) === oldValue;
        }
        return newValue === oldValue ||
            (typeof newValue === 'number' && typeof oldValue === 'number' &&
            isNaN(newValue) && isNaN(oldValue));
    }

    function countScopes(scope) {
        var c = 1;
        for(var i = 0, len = scope.$c.length; i < len; i += 1) {
            c += countScopes(scope.$c[i]);
        }
        return c;
    }

    function execWatchers(scope) {
        if (scope.$$ignore) {
            ignoreStat.inc(countScopes(scope));
            return false;
        }
        digestStat.inc();
        var newValue, oldValue;
        var i = scope.$w.length;
        var watcher;
        var dirty = false;
        while (i--) { // reverse
            watcher = scope.$w[i];
            if (watcher && !watcher.dead) {// dead watchers are in process of being collected.
                newValue = watcher.watchFn(scope);
                oldValue = watcher.last;
                if (newValue !== undefined && watcher.unwatchOnValue) {
                    unwatch(watcher.id);
                }
                if (!isEqual(newValue, oldValue, watcher.deep) || oldValue === initWatchVal) {
                    scope.$r.$lw = watcher;
                    watcher.last = (watcher.deep ? JSON.stringify(newValue) : newValue);
                    if (scope.$benchmark) {
                        scope.$benchmark.watch(watcher, scope, newValue, (oldValue === initWatchVal ? newValue : oldValue));
                    } else {
                        watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), scope);
                    }
                    if (oldValue === initWatchVal) {
                        watcher.last = oldValue = undefined;// only have it be initWatchVal the first time.
                    }
                    dirty = true;
                } else if (scope.$r.$lw === watcher) {
                    return dirty;
                }
            }
        }
        return dirty;
    }

    function destroyChildren(scope, children) {
        if (children[0]) {
            children.pop()[DESTROY]();
            setTimeout(function() {
                destroyChildren(scope, children);
            });
        } else {
            finalizeDestroy(scope);
        }
    }

    function finalizeDestroy(scope) {
        var i, $id = scope.$id, wl = scope.$w.length;
        for(i = 0; i < wl; i += 1) {
            unwatch(scope.$w[i].id);
        }
        scope.$w.length = 0;// kill anything with a reference to this array.
        for(i in scope.$l) {
            if (scope.$l.hasOwnProperty(i)) {
                scope.$l[i].length = 0;// kill references to those arrays.
            }
        }
        for(i in scope) {
            if (scope.hasOwnProperty(i)) {
                scope[i] = null;
                delete scope[i];
            }
        }
        delete destroying[$id];
        scopeCountStat.dec();
    }

    function unwatchWatcher(scope, watcher) {
        if (!watcher.dead) {
            delete watchers[watcher.id];
            watcher.dead = true;
            watcher.scope = scope;// only assign when it is being destroyed.
            unwatching.push(watcher);
            if (!intv) {
                intv = setInterval(onInterval);
            }
        }
    }

    function onInterval() {
        var watcher, scope, i, index;
        for(i = 0; i < intvMax && i < unwatching.length; i += 1) {
            watcher = unwatching.shift();
            scope = watcher.scope;
            watchCount.dec();
            if (scope && scope.$w && scope.$w.length && (index = scope.$w.indexOf(watcher)) !== -1) {
                if (index !== -1) {
                    scope.$w.splice(index, 1);
                    scope.$r.$lw = null;
                    scope = null;
                    delete watcher.scope;
                    watcher = null;
                }
            }
        }
        if (!unwatching.length) {
            clearInterval(intv);
            intv = 0;
        }
    }

    function isBindOnce(str) {
        return !!(str && str[0] === ':' && str[1] === ':');
    }

    function handleBindOnce(context, property, watchId) {
        var type = typeof context;
        var str = type === "string" ? context : context[property];
        if (isBindOnce(str)) {
            str = str.substr(2, str.length);
            watchId && unwatch(watchId);
        }
        if (type !== "string") {
            context[property] = str;
        }
        return str;
    }

    function unwatchAfterValue() {
        this.unwatchOnValue = true;
    }

    function stringWatchInterceptor(str) {
        return handleBindOnce(str, null, unwatchAfterValue, this);
    }

    function strWatcher() {
        var s = this.scope;
        return s.$interpolate(s, this.expr, true);
    }

    function unwatch(watchId) {
        var w = watchers[watchId];
        if (w) {
            unwatchWatcher(w.scope, w);
        }
    }

    function generateId() {
        return (counter+=1).toString(36);
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
        scopeCountStat.inc();
    }

    var scopePrototype = Scope.prototype;
    scopePrototype.$isBindOnce = isBindOnce;
    scopePrototype.$handleBindOnce = handleBindOnce;

    scopePrototype.$watchOnce = function(watchFn, listenFn, deep) {
        var watchId;
        if (typeof watchFn === "string") {
            return this.$watch('::' + watchFn, listenFn, deep);
        } else {
            watchId = this.$watch(function() {
                unwatch(watchId);
                apply(watchFn, this, arguments);
            }, listenFn, deep);
        }
    };

    scopePrototype.$unwatch = unwatch;
    scopePrototype.$watch = function (watchFn, listenerFn, deep) {
        var self = this, watcher;
        if(!watchFn) {
            return;
        }

        watcher = {
            id: watchCounter+=1,
            scope: self,
            expr: '',// very helpful when debugging you can see what it was evaluated from.
            watchFn: watchFn,
            listenerFn: listenerFn || function () {
            },
            deep: !!deep,
            last: initWatchVal
        };

        if (typeof watchFn === 'string') {
            watcher.expr = stringWatchInterceptor.call(watcher, watchFn);
            if (!watcher.expr) {
                return;
            }
            watcher.watchFn = strWatcher;
        }
        self.$w.unshift(watcher);//This may be what is affecting top down vs bottom up. If we do a push it may go the oppsite way.
        self.$r.$lw = null;
        self.$lw = null;
        watchers[watcher.id] = watcher;
        watchCount.inc();
        return watcher.id;
    };

    scopePrototype.$$digestOnce = function () {
        return this.$$scopes(execWatchers);// returns dirty true/false
    };

    scopePrototype.$$getPhase = function() {
        return this.$r.$ph;
    };

    scopePrototype.$digest = function () {
        var ttl = 10;
        var dirty;
        var self = this;
        if (self.$$getPhase()) {
            return;
        }
        self.$r.$lw = null;
        self.$$beginPhase();
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
                self.$$clearPhase();
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

        self.$$clearPhase();
    };

    scopePrototype.$eval = function (expr, locals) {
        var self = this;
        return self.$interpolate(locals || self, expr, true);
    };

    scopePrototype.$apply = function (expr) {
        var self = this;
        if (self.$r.$ph) {
            self.$r.$$apply_pending = {expr:expr};
            return;
        }
        if(!self.$isIgnored()) {
            try {
                if (expr) {
                    return self.$eval(expr);// this does not stop the digest. finally always happens.
                }
            } finally {
                self.$r.$digest();
            }
        }
        if (self.$r.$$apply_pending) {
            setTimeout(applyLater.bind(self));
        }
    };

    function applyLater() {
        if (this.$r.$$apply_pending) {
            var pend = this.$r.$$apply_pending;
            delete this.$r.$$apply_pending;
            this.$apply(pend.expr);
        }
    }

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

    scopePrototype.$$beginPhase = function () {
        this.$r.$ph = true;// always set on root scope.
        digestStat.next();
        ignoreStat.next();
    };

    scopePrototype.$$clearPhase = function () {
        this.$r.$ph = null;
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
            scopeCountStat.inc();
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
        //TODO: IS this working right?
        var dirty = fn(self);
        var childrenDirty = every(self.$c, function (child) {
            return child.$$scopes(fn);
        });
        return dirty || childrenDirty;
    };

    scopePrototype[DESTROY] = function () {
        if (destroying[this.$id]) {// prevent double destroy just in case.
            return;
        }
        var self = this;
        var $id = self.$id;
        if (self === self.$r) {
            return;
        }
        destroying[$id] = true;
        self[BROADCAST](DESTROY);
        var siblings = self.$p.$c;
        var indexOfThis = siblings.indexOf(self);
        if (indexOfThis >= 0) {
            siblings.splice(indexOfThis, 1);
            destroyChildren(self, self.$c.slice());
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
        if (self.$$ignoreEvents && self.eventName !== DESTROY) {
            return;
        }
        apply(db.log, db, [EMIT].concat(arguments));
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
        if (self.$$ignoreEvents && self.eventName !== DESTROY) {
            return;
        }
        apply(db.log, db, [BROADCAST].concat(arguments));
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
        // if destroying it will cycle through each child and destroy it.
        // only fire on this element and not the children because they will fire their own.
        if (eventName === DESTROY) {
            self.$$fire(eventName, listenerArgs);
            return event;
        }
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
                apply(listeners[i], this, listenerArgs);
                i++;
            }
        }
        return event;
    };

    return function (interpolate) {
        return new Scope(interpolate);
    };

});
