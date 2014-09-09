function Scope() {
}

Scope.prototype.$resolve = function (path, value) {
    return resolve(this, path, value);
};

Scope.prototype.$digest = function () {
    digest(this);
};

Scope.prototype.$destroy = function () {
//            console.log('$destroy scope:%s', this.$id);
    this.$off(DESTROY_STR, this.$destroy);
    this.$broadcast(DESTROY_STR);
    this.$$watchers.length = 0;
    this.$$listeners.length = 0;
//            while (this.$$watchers.length) this.$$watchers.pop();
//            while (this.$$listeners.length) this.$$listeners.pop();
    while (this.$$handlers.length) this.$$handlers.pop()();
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

Scope.prototype.$emit = function (evt) {
    var s = this;
    while (s) {
        if (s.$$listeners[evt]) {
            each(s.$$listeners[evt], evtHandler, arguments);
        }
        s = s.$parent;
    }
};

Scope.prototype.$broadcast = function (evt) {
    if (this.$$listeners[evt]) {
        each.apply({scope: this}, [this.$$listeners[evt], evtHandler, arguments]);
    }// broadcast on myself.
    var s = this.$$childHead;
    while (s) {
        s.$broadcast.apply(s, arguments);
        s = s.$$nextSibling;
    }
};

Scope.prototype.$on = function (evt, fn) {
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

Scope.prototype.$off = function (evt, fn) {
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

Scope.prototype.$watch = function (strOrFn, fn) {
    var me = this, watch;
    if (typeof strOrFn === 'string') {
        watch = function () {
            var result = interpolate(me, strOrFn);
            if (result && result.$$dirty) {
                delete result.$$dirty;
                this.$$dirty = true;
            }
            return result;
        };
    } else {
        watch = strOrFn;// it should be a fn
    }
    me.$$watchers.push(createWatch(me, watch, fn));
};

Scope.prototype.$watchOnce = function (strOrFn, fn) {
    return this.$watch(strOrFn, fn, true);
};

Scope.prototype.$apply = $apply;