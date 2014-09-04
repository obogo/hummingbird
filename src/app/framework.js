ready(function () {
    var each = helpers.each;

    function createModule(name) {
        var rootEl;
        var injector = createInjector();
        var bootstraps = [];
        var self;
        var MAX_DIGESTS = 10;
        var elements = {};
        var prefix = 'go';
        var events = 'click mousedown mouseup keydown keyup'.split(' ');
        var counter = 1;
        var invoke = injector.invoke;
        var $get = injector.invoke.get;
        var $set = function (name, value, type) {
            if (typeof value === "string" && value.indexOf('<') !== -1) {
                value = value.trim();
            }
            if (typeof value === "function") {
                value.type = type;
            }
            injector.invoke.set(name, value);
            return self;
        };
        var $apply = throttle(function () {
            $get('$rootScope').$digest();
        }, 100);

        function bootstrap(fn) {
            bootstraps.push(fn);
        }

        function ready() {
            while(bootstraps.length) {
                invoke(bootstraps.shift(), self);
            }
            $apply();
        }

        function init() {
            self = {
                bootstrap: bootstrap,
                interpolate: interpolate,
                view: view,
                digest: digest,
                addChild: addChild,
                removeChild: removeChild,
                set: $set,
                get: $get,
                directive: directive,
                filter: filter,
                service: service,
                ready: ready,
                element: function (val) {
                    if (val !== undefined) {
                        rootEl = val;
                        compile(rootEl, $get('$rootScope'));
                    }
                    return rootEl;
                }
            };
            $set('module', self);
            var rootScope = createScope({}, null);
            $set('$rootScope', rootScope);
            rootScope.$digest = rootScope.$digest.bind(rootScope);

            each(events, function (eventName) {
                self.set(prefix + eventName, function () {
                    return {
                        // scope: {},// pass an object if isolated. not a true
                        link: function (scope, el) {
                            //TODO: need to make addEventListener browser compatible.
                            function handle(evt) {
                                interpolate(scope, this.getAttribute(prefix + '-' + eventName));
                                scope.$apply();
                            }

                            el.addEventListener(eventName, handle);
                            scope.$$handlers.push(function () {
                                el.removeEventListener(eventName, handle);
                            });
                        }
                    };
                }, 'event');
            });
            return self;
        }


        function Scope() {
        }

        Scope.prototype.$digest = function () {
            digest(this);
        };
        Scope.prototype.$destroy = function () {
            console.log("$destroy scope:%s", this.$id);
            this.$off('$destroy', this.$destroy);
            this.$broadcast('$destroy');
            while (this.$$watchers.length) this.$$watchers.pop();
            while (this.$$listeners.length) this.$$listeners.pop();
            while (this.$$handlers.length) this.$$handlers.pop()();
            if (this.$$prevSibling) this.$$prevSibling.$$nextSibling = this.$$nextSibling;
            if (this.$$nextSibling) this.$$nextSibling = this.$$prevSibling;
            if (this.$parent && this.$parent.$$childHead === this) this.$parent.$$childHead = this.$$nextSibling;
            elements[this.$id].parentNode.removeChild(elements[this.$id]);
            delete elements[this.$id];
        };
        Scope.prototype.$emit = function (evt) {
            var s = this;
            while (s) {
                if (s.$$listeners[evt]) each(s.$$listeners[evt], evtHandler, arguments);
                s = s.$parent;
            }
        };
        Scope.prototype.$broadcast = function (evt) {
            if (this.$$listeners[evt]) each.apply({scope: this}, [this.$$listeners[evt], evtHandler, arguments]);// broadcast on myself.
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
        Scope.prototype.$apply = $apply;

        function evtHandler(fn, index, list, args) {
            fn.apply(this, args);
        }

        function createScope(obj, parentScope) {
            var s = new Scope();
            extend(s, obj);
            s.$id = (counter++).toString(16);
            s.$parent = parentScope;
            if (parentScope) {
                if (!parentScope.$$childHead) parentScope.$$childHead = s;
                s.$$prevSibling = parentScope.$$childTail;
                if (s.$$prevSibling) s.$$prevSibling.$$nextSibling = s;
                parentScope.$$childTail = s;
            }
            s.$$watchers = [];
            s.$$listeners = [];
            s.$$handlers = [];
            s.$on('$destroy', s.$destroy);
            return s;
        }

        function html2dom(html) {
            var container = document.createElement('div');
            container.innerHTML = html;
            return container.firstChild;
        }

        function interpolateError(er, scope, str, errorHandler) {
            var eh = errorHandler || defaultErrorHandler;
            if (eh) {
                eh(er, "Error evaluating: '" + str + "' against %o", scope);
            }
        }

        function interpolate(scope, str, errorHandler) {
            var fn = Function, fltr = parseFilter(str, scope), result;
            str = fltr ? fltr.str : str;
            try {
//            result = (new fn('with(this) { return this.' + str + '; }')).apply(scope); // execute script in private context
                result = (new fn('with(this) { var result; try { result = this.' + str + '; } catch(er) { result = er; } finally { return result; }}')).apply(scope);
                if (typeof result === "object" && (result.hasOwnProperty('stack') || result.hasOwnProperty('stacktrace') || result.hasOwnProperty('backtrace'))) {
                    interpolateError(result, scope, str, errorHandler);
                }
            } catch (er) {
                if (scope.$parent) {
                    return interpolate(scope.$parent, str);
                }
                interpolateError(er, scope, str, errorHandler);
            }
            if (result + '' === 'NaN') {
                result = '';
            }
            return fltr ? fltr.filter(result) : result;
        }

        function defaultErrorHandler(er, extraMessage, data) {
            if (window.console && console.warn) console.warn(extraMessage + "\n" + er.message + "\n" + (er.stack || er.stacktrace || er.backtrace), data);
        }

        function parseFilter(str, scope) {
            if (str.indexOf('|') !== -1) {
                var parts = str.split('|');
                parts[1] = parts[1].split(':');
                var filter = $get(parts[1].shift())(),
                    args = parts[1];
                each(args, injector.getInjection, scope);
                return {
                    filter: function (value) {
                        args.unshift(value);
                        return filter.apply(scope, args);
                    },
                    str: parts[0]
                };
            }
            return undefined;
        }

        function supplant(str, o) {
            if (str) {
                return str.replace(/{([^{}]*)}/g, function (a, b) {
                    var r = interpolate(o, b.trim());
                    return typeof r === 'string' || typeof r === 'number' ? r : '';
                });
            }
            return str;
        }

        function view(name) {
            var tpl = $get(name);
            return tpl ? html2dom(tpl) : null;
        }

        function addChild(parentEl, childEl) {
            if (parentEl !== rootEl || (rootEl.contains && !rootEl.contains(parentEl))) {
                throw new Error("parent element not found in %o", rootEl);
            }
            parentEl.insertAdjacentHTML('beforeend', childEl.outerHTML);
            var parentScope = createScope({}, $get('$rootScope'));
            compile(parentEl.children[parentEl.children.length - 1], parentScope);
        }

        function findDirectives(el) {
            // if isolate scope create new child scope for them
            var attrs = el.attributes, result = [];
            each(attrs, getDirectiveFromAttr, result);
            return result;
        }

        function getDirectiveFromAttr(attr, index, list, result) {
            var name = attr ? attr.name.split('-').join('') : '', dr;
            if ((dr = $get(name))) result.push(dr);
        }

        function compile(el, scope) {
            var dtvs = findDirectives(el);
            if (dtvs && dtvs.length) {
                each(dtvs, compileDirective, el, scope);
            }
            if (el) {
                if (el.scope) scope = el.scope();
                if (el.children.length) each(el.children, compileChild, scope);
                each(el.childNodes, createWatchers, scope);
            }
            $get('$rootScope').$digest();
            return el;
        }

        function compileChild(el, index, list, scope) {
            compile(el, scope);
        }

        function compileDirective(directive, index, list, el, scope) {
            var locals = {
                    scope: el.scope ? el.scope() : scope,
                    el: el
                },
                dir,
                id = el.getAttribute('go-id');// this needs to pass locals and
            el.scope = function () {
                return locals.scope;
            };
            dir = invoke(directive, this, {});
            if (dir.scope) {
                if (id) {
                    throw new Error("Trying to assign multiple scopes to the same dom element is not permitted.");
                }
                if (dir.scope === true) {
                    locals.scope = createScope(dir.scope, scope);
                } else {
                    dir.scope.$$isolate = true;
                    locals.scope = createScope(dir.scope, scope);
                }
            }
            el.setAttribute('go-id', locals.scope.$id);
            elements[locals.scope.$id] = el;
            invoke(dir.link, dir, locals);
        }

        function createWatchers(node, index, list, scope) {
            if (node.nodeType === 3) {
                if (node.nodeValue.indexOf('{') !== -1) {
                    var value = node.nodeValue;
                    scope.$$watchers.push({
                        node: node,
                        watchFn: function () {
                            return supplant(value, scope);
                        },
                        listenerFn: function (newVal, oldVal) {
                            node.nodeValue = newVal;
                        }
                    });
                }
            } else if (!node.getAttribute('go-id') && node.childNodes.length) {
                // keep going down the dom until you find another directive or bind.
                each(node.childNodes, createWatchers, scope);
            }
        }

        function removeChild(childEl) {
            var id = childEl.getAttribute('go-id'), i = 0, p, s, len;
            if (id) {
                s = findScopeById(id);
                s.$destroy();
            } else {
                // need to remove watchers that are in this area.
                // find the parent scope and then remove any watchers that are on a node contained in this dom.
                p = childEl.parentNode;
                while (!p.getAttribute('go-id')) {
                    p = p.parentNode;
                }
                if (p && p.getAttribute('go-id')) {
                    s = p.scope();
                    len = s.$$watchers.length;
                    while (i < len) {
                        if (childEl.contains(s.$$watchers[i].node)) {
                            s.$$watchers.splice(i, 1);
                            i -= 1;
                            len -= 1;
                        }
                        i += 1;
                    }
                }
            }
        }

        function findScopeById(id, scope) {
            var s = scope || $get('$rootScope'), result;
            while (s) {
                if (s.$id === id) {
                    return s;
                }
                result = s.$$childHead && findScopeById(id, s.$$childHead) || null;
                if (result) {
                    return result;
                }
                s = s.$$nextSibling;
            }
        }

        function digest(scope) {
            var dirty, count = 0;
            do {
                dirty = digestOnce(scope);
                count += 1;
                if (count >= MAX_DIGESTS) {
                    throw new Error("Exceeded max digests of " + MAX_DIGESTS);
                }
            } while (dirty && count < MAX_DIGESTS);
        }

        function digestOnce(scope) {
            var child = scope.$$childHead, next, status = {dirty: false};
            scope.$$phase = 'digest';
            each(scope.$$watchers, runWatcher, status);
            while (child) {
                next = child.$$nextSibling;
                child.$digest();
                child = next;
            }
            scope.$$phase = null;
            return status.dirty;
        }

        function runWatcher(watcher, index, list, status) {
            var newVal = watcher.watchFn(), oldVal = watcher.last;
            if (newVal !== oldVal) {
                watcher.last = newVal;
                watcher.listenerFn(newVal, oldVal);
                status.dirty = true;
            }
        }

        function filter(name, fn) {
            return $set(name, fn, 'filter');
        }

        function directive(name, fn) {
            return $set(name, fn, 'directive');
        }

        function service(name, fn) {
            return $set(name, fn, 'service');
        }

        return init();
    }

    function createInjector() {
        var registered = {}, injector = {};

        function invoke(fn, scope, locals) {
            var f;
            if (fn instanceof Array) {
                f = fn.pop();
                f.$inject = fn;
                fn = f;
            }
            if (!fn.$inject) {
                fn.$inject = getInjectionArgs(fn);
            }
            var args = fn.$inject ? fn.$inject.slice() : [];
            each(args, getInjection, locals);
            return fn.apply(scope, args);
        }

        function getInjectionArgs(fn) {
            var str = fn.toString();
            return str.match(/\(.*\)/)[0].match(/([\$\w])+/gm);
        }

        function getInjection(type, index, list, locals) {
            var result, cacheValue = injector.invoke.get(type);
            if (cacheValue !== undefined) {
                result = cacheValue;
            } else if (locals && locals[type]) {
                result = locals[type];
            }
            list[index] = result;
        }

        injector.invoke = invoke;
        injector.getInjection = getInjection;
        injector.invoke.set = function (name, fn) {
            registered[name.toLowerCase()] = fn;
        };
        injector.invoke.get = function (name) {
            return registered[name.toLowerCase()];
        };
        return injector;
    }

    function extend(target, source) {
        var args = Array.prototype.slice.call(arguments, 0), i = 1, len = args.length, item, j;
        while (i < len) {
            item = args[i];
            for (j in item) {
                if (item.hasOwnProperty(j)) {
                    target[j] = source[j];
                }
            }
            i += 1;
        }
        return target;
    }

    function throttle(fn, delay) {
        var pause, args;
        return function () {
            if (pause) {
                args = arguments;
                return;
            }
            pause = 1;

            fn.apply(fn, arguments);

            setTimeout(function () {
                pause = 0;
                if (args) {
                    fn.apply(fn, args);
                }
            }, delay);
        }
    }

//TODO: need to set references all under app name. Especially needed for unit tests.
    var modules = {};

    function module(name, el) {
        var mod = modules[name] = modules[name] || createModule(name);
        if (el) {
            mod.element(el);
        }
        return mod;
    }

    function createModuleFromDom(el) {
        var mod = module(el.getAttribute('go-app'), el);
        mod.ready();
    }

    app.framework = {
        module: module
    };

    browser.ready(function () {
        var modules = document.querySelectorAll("[go-app]");
        each(modules, createModuleFromDom);
    });
});