(function () {
    var injector = new Injector(),
        interpolate = new Interpolate(injector),
        counter = 0,
        name = 'unit',
        $DESTROY = "$destroy",
        MAX_DIGESTS = 10,
        elements = {},
        each = helpers.each,
        rootScope = new Scope();

    function uuid() {
        return name + '-' + (counter++).toString(16);
    }

    function Scope() {
        this.$id = uuid();
        this.$$watchers = [];
        this.$$listeners = {};
        this.$$handlers = [];
        this.$root = rootScope;
    }

    var scopePrototype = Scope.prototype;
//scopePrototype.$resolve = function (path, value) {
//    return resolve(this, path, value);
//};

    scopePrototype.$digest = digest;

    scopePrototype.$destroy = function () {
//            console.log('$destroy scope:%s', this.$id);
        this.$off($DESTROY, this.$destroy);
        this.$broadcast($DESTROY);
        this.$$watchers = this.$$listeners = null;
        while (this.$$handlers.length) this.$$handlers.pop()();// even unwatchers
        if (this.$$prevSibling) {
            this.$$prevSibling.$$nextSibling = this.$$nextSibling;
        }
        this.$$nextSibling = this.$$prevSibling;
        if (this.$parent && this.$parent.$$childHead === this) {
            this.$parent.$$childHead = this.$$nextSibling;
        }
        if (this.$parent && this.$parent.$$childTail === this) {
            this.$parent.$$childTail = this.$$prevSibling;
        }
        elements[this.$id].parentNode.removeChild(elements[this.$id]);
        delete elements[this.$id];
    };

    scopePrototype.$emit = function (evt) {
        var s = this;
        while (s) {
            if (s.$$listeners[evt]) {
                each(s.$$listeners[evt], evtHandler, arguments);
            }
            s = s.$parent;
        }
    };

    scopePrototype.$broadcast = function (evt) {
        if (this.$$listeners[evt]) {
            each.apply({scope: this}, [this.$$listeners[evt], evtHandler, arguments]);
        }// broadcast on myself.
        var s = this.$$childHead;
        while (s) {
            s.$broadcast.apply(s, arguments);
            s = s.$$nextSibling;
        }
    };

    scopePrototype.$on = function (evt, fn) {
        var self = this;
        self.$$listeners[evt] = self.$$listeners[evt] || [];
        self.$$listeners[evt].push(fn);
        return function () {
            var ary = self.$$listeners[evt], index = ary.indexOf(fn);
            if (index !== -1) {
                ary.splice(index, 1);
            }
        };
    };

    scopePrototype.$off = function (evt, fn) {
        var list = this.$$listeners[evt], i = 0, len = list.length;
        while (i < len) {
            if (!fn || (fn && list[i] === fn)) {
                list.splice(i, 1);
                i -= 1;
                len -= 1;
            }
            i += 1;
        }
    };

    scopePrototype.$watch = function (strOrFn, fn, useDeepWatch) {
        var s = this, watch;
        if (typeof strOrFn === 'string') {
            watch = function () {
                var result = interpolate.exec(s, strOrFn);
                if (result && result.$$dirty) {
                    delete result.$$dirty;
                    this.$$dirty = true;
                }
                return result;
            };
        } else {
            watch = strOrFn;// it should be a fn
        }
        s.$$watchers.push(createWatch(s, watch, fn, useDeepWatch));
    };

    scopePrototype.$watchOnce = function (strOrFn, fn, useDeepWatch) {
        return this.$watch(strOrFn, fn, useDeepWatch, true);
    };

    scopePrototype.$eval = function(str) {
        return interpolate.exec(this, str);
    };

    scopePrototype.$apply = function (str) {
        if (str) {
            interpolate.exec(this, str);
        }
        this.$root.$digest();
    };

    scopePrototype.$new = function (isolate) {
        var s = this,
            ChildScope,
            child;

        if (isolate) {
            child = new Scope();
        } else {
            ChildScope = function () {
            }; // should be anonymous; This is so that when the minifier munges
            // the name it does not become random set of chars. This will then show up as class
            // name in the web inspector.
            ChildScope.prototype = this;
            child = new ChildScope();
            child.$id = uuid();
        }
        child['this'] = child;
        child.$$listeners = {};
        child.$parent = s;
        child.$$watchers = [];
        child.$$handlers = [];
        child.$$nextSibling = child.$$childHead = child.$$childTail = null;
        child.$$prevSibling = s.$$childTail;
        if (s.$$childHead) {
            s.$$childTail.$$nextSibling = child;
            s.$$childTail = child;
        } else {
            s.$$childHead = s.$$childTail = child;
        }
        return child;
    };

    function digest() {
//            console.log("digest %s", scope.$id);
        var dirty, ttl = MAX_DIGESTS;
        this.$$lastDirtyWatch = null;
        do {
            dirty = digestOnce.call(this);
            if (dirty && !(ttl--)) {
                throw new Error("app.errors.MESSAGES.E3" + MAX_DIGESTS);
            }
        } while (dirty);
    }

    function digestOnce() {
        var scope = this;
        if (scope.$$phase) {
//TODO: Still not sure if we should have this.
//                throw new Error(app.errors.MESSAGES.E7);
            return;
        }
        var child = scope.$$childHead, next, dirty = {value:false};
        scope.$$phase = 'digest';
        each(scope.$$watchers, runWatcher, scope, dirty);
        scope.$$phase = null;
        while (child) {
            next = child.$$nextSibling;
//                digest(child);
            child.$digest.call(child);
            child = next;
        }
        return dirty.value;
    }

    function runWatcher(watcher, index, list, scope, dirty) {
        var newVal = watcher.watchFn(scope),
            oldVal = watcher.last;
        // $$dirty used to force digest once.
        if (watcher.$$dirty || !areEqual(newVal, oldVal, watcher.useDeepWatch)) {
            delete watcher.$$dirty;
            scope.$$lastDirtyWatch = watcher;
            watcher.last = (watcher.useDeepWatch ? JSON.stringify(newVal) : newVal);
            if (watcher.listenerFn) {
                watcher.listenerFn(newVal, (oldVal === initWatchVal ? newVal : oldVal), scope);
            }
            dirty.value = true;
        } else if (scope.$$lastDirtyWatch === watcher) {
            delete scope.$$lastDirtyWatch;
            dirty.value = false;
            return dirty;
        }
    }

    function areEqual(newValue, oldValue, useDeepWatch) {
        if (useDeepWatch) {
            return JSON.stringify(newValue) === oldValue;
        }
        return newValue === oldValue ||
            (typeof newValue === 'number' && typeof oldValue === 'number' &&
                isNaN(newValue) && isNaN(oldValue));
    }

    function createWatch(scope, watch, listen, useDeepWatch, watchOnce) {
        //TODO: if once is passed then the listenerFn needs wrapped so it removes after it executes.
        var fn = listen;
        if (watchOnce) {
            fn = function (newVal, oldVal) {
                listen.call(this, newVal, oldVal);
                var i = scope.$$listeners.indexOf(fn);
                if (i !== -1) {
                    scope.$$listeners.splice(i, 1);
                }
            };
        }
        return {
            watching: watch,
            last: initWatchVal,
            watchFn: watch,
            listenerFn: fn,
            useDeepWatch: !!useDeepWatch
        };
    }

    function initWatchVal(){}

    angular.Scope = Scope;
}());