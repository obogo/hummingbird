/* global MESSAGES, app, browser, ready, console, helpers, parsers, formatters */
ready(function () {
    'use strict';

    var each = helpers.each;

    // :: constants ::
    var PREFIX = 'go';
    var ID_ATTR = PREFIX + '-id';
    var APP_ATTR = PREFIX + '-app';

    function createModule(name) {
        var rootEl;
        var injector = createInjector();
        var bootstraps = [];
        var self;
        var elements = {};
        var counter = 1;
        var invoke = injector.invoke;
        var $get = injector.invoke.get;
        var $getRegistered = injector.invoke.getRegistered;
        var $set = function (name, value, type) {
            // if the name has multiples. Then we split and register them all as aliases to the same function.
            each(name.split(' '), setSingle, value, type);
            return self;
        };
        var interpolator = new Interpolate(injector);
        var interpolate = interpolator.exec;

        var setSingle = function (name, index, list, value, type) {
            if (typeof value === 'string' && value.indexOf('<') !== -1) {
                value = value.trim();
            }
            if (typeof value === 'function') {
                value.type = type;
            }
            injector.invoke.set(name, value);
        };

        var $apply = app.utils.throttle(function (val) {
            var rootScope = $get(app.consts.$ROOT_SCOPE);
            if (val) {
                val.$$dirty = true;
            }
            rootScope.$digest();
        });

        function bootstrap(fn) {
            bootstraps.push(fn);
        }

        function ready() {
            while (bootstraps.length) {
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
                registered: $getRegistered,
                resolve: resolve,
                directive: directive,
                filter: filter,
                service: service,
                ready: ready,
                each: each,
                element: function (val) {
                    var rs = $get(app.consts.$ROOT_SCOPE);
                    if (val !== undefined) {
                        rootEl = val;
                        rootEl.setAttribute(ID_ATTR, rs.$id);
                        elements[rs.$id] = rootEl;
                        compile(rootEl, rs);
                    }
                    return rootEl;
                }
            };

            $set('module', self);
            var rootScope = createScope({}, null);
            $set(app.consts.$ROOT_SCOPE, rootScope);
            rootScope.$digest = rootScope.$digest.bind(rootScope);

            // create app directive
            self.set(PREFIX + 'app', function () {
                return {
                    link: function (scope, el) {

                    }
                };
            });

            // TODO: INITIALIZE THIS ELSEWHERE
            app.directives.events(PREFIX, self);
            app.directives.if(PREFIX + 'if', self);
//            app.directives.repeat(PREFIX + 'repeat', self);

            // create repeat directive
            self.set(PREFIX + 'repeat', function (alias) {
                return {
                    link: function (scope, el) {
                        var template = el.children[0].outerHTML;
                        el.removeChild(el.children[0]);
                        var statement = el.getAttribute(alias);
                        statement = each(statement.split(/\s+in\s+/), app.utils.trimStrings);
                        var itemName = statement[0],
                            watch = statement[1];

                        function render(list, oldList) {
                            var i = 0, len = Math.max(list.length, el.children.length), child, s;
                            while (i < len) {
                                child = el.children[i];
                                if (!child) {
                                    el.insertAdjacentHTML('beforeend', formatters.stripHTMLComments(template));
                                    child = el.children[el.children.length - 1];
                                    child.setAttribute(PREFIX + '-repeat-item', '');
                                    compile(child, scope);
                                }
                                if (list[i]) {
                                    s = child.scope();
                                    s[itemName] = list[i];
                                    s.$index = i;
                                    compileWatchers(child, s);
                                } else {
                                    child.scope().$destroy();
                                }
                                i += 1;
                            }
                            compileWatchers(el, scope);
                        }

                        scope.$watch(watch, render);
                    }
                };
            });

            self.set(PREFIX + 'RepeatItem', function () {
                return {
                    scope: true,
                    link: function (scope, el) {
                    }
                };
            });
            return self;
        }


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
            this.$off(app.consts.$DESTROY, this.$destroy);
            this.$broadcast(app.consts.$DESTROY);
            this.$$watchers.length = 0;
            this.$$listeners.length = 0;
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

        function evtHandler(fn, index, list, args) {
            fn.apply(this, args);
        }

        function createScope(obj, parentScope, el) {
            var s = new Scope();
            app.utils.extend(s, obj);
            s.$id = name + '-' + (counter++).toString(16);
//            console.log(s.$id);
            s.$parent = parentScope;
            if (parentScope) {
                if (!parentScope.$$childHead) {
                    parentScope.$$childHead = s;
                }
                s.$$prevSibling = parentScope.$$childTail;
                if (s.$$prevSibling) {
                    s.$$prevSibling.$$nextSibling = s;
                }
                if (parentScope.$$childTail) {
                    parentScope.$$childTail.$$nextSibling = s;
                }
                parentScope.$$childTail = s;
            }
            s.$$watchers = [];
            s.$$listeners = [];
            s.$$handlers = [];
            s.$on(app.consts.$DESTROY, s.$destroy);
            if (el) {
                el.setAttribute(ID_ATTR, s.$id);
                el.scope = function () {
                    return s;
                };
                elements[s.$id] = el;
            }
            return s;
        }

        function resolve(object, path, value) {

            path = path || '';
            var stack = path.match(/(\w|\$)+/g), property;
            var isGetter = typeof value === 'undefined';

            while (stack.length > 1) {
                property = stack.shift();

                switch (typeof object[property]) {
                    case 'object':
                        object = object[property];
                        break;
                    case 'undefined':
                        if (isGetter) {
                            return;
                        }
                        object = object[property] = {};
                        break;
                    default:
                        throw new Error(app.errors.MESSAGES.E5, property);
                }
            }

            if (typeof value === 'undefined') {
                return object[stack.shift()];
            }

            object[stack.shift()] = value;

            return value;
        }

        function parseBinds(str, o) {
            if (str) {
                return str.replace(/{{([^{}]*)}}/g, function (a, b) {
                    var r = interpolate(o, b.trim());
                    return typeof r === 'string' || typeof r === 'number' ? r : '';
                });
            }
            return str;
        }

        function view(name) {
            var tpl = $get(name);
            return tpl ? parsers.htmlToDOM(tpl) : null;
        }

        function addChild(parentEl, childEl) {
            if (parentEl !== rootEl && rootEl.contains && !rootEl.contains(parentEl)) {
                throw new Error(app.errors.MESSAGES.E4, rootEl);
            }
            parentEl.insertAdjacentHTML('beforeend', formatters.stripHTMLComments(childEl.outerHTML || childEl));
            var scope = findScope(parentEl),
                child = compile(parentEl.children[parentEl.children.length - 1], scope),
                s = child.scope && child.scope();
            if (s && s.$parent) {
                compileWatchers(elements[s.$parent.$id], s.$parent);
            }
            return child;
        }

        function findDirectives(el) {
            // if isolate scope create new child scope for them
            var attrs = el.attributes, result = [];
            each(attrs, getDirectiveFromAttr, result);
            return result;
        }

        function getDirectiveFromAttr(attr, index, list, result) {
            var name = attr ? attr.name.split('-').join('') : '', dr;
            if ((dr = $get(name))) {
                result.push({fn: dr, alias: attr.name});
            }
        }

        function removeComments(el, index, list, parent) {
            if (el) {// after removing elements we will get some that are not there.
                if (el.nodeType === 8) {// comment
                    parent.removeChild(el);
                } else if (el.childNodes) {
                    each(el.childNodes, removeComments, el);
                }
            } else {
                return true;// if we get one not there. exit.
            }
        }

        function compile(el, scope) {
            each(el.childNodes, removeComments, el);
            var dtvs = findDirectives(el), links = [];
            if (dtvs && dtvs.length) {
                each(dtvs, compileDirective, el, scope, links);
                each(links, processLink, el);
            }
            if (el) {
                if (el.scope) {
                    scope = el.scope();
                }
                if (el.children.length) {
                    each(el.children, compileChild, scope);
                }
                if (el.getAttribute(ID_ATTR)) {
                    compileWatchers(el, scope);// if we update our watchers. we need to update our parent watchers.
                }
            }
            return el;
        }

        function compileWatchers(el, scope) {
            each(el.childNodes, createWatchers, scope);
//            console.log('created %s for %s', scope.$$watchers, scope.$id);
        }

        function compileChild(el, index, list, scope) {
            compile(el, scope);
        }

        function compileDirective(directive, index, list, el, scope, links) {
            var s = el.scope ? el.scope() : scope;
            var dir, id = el.getAttribute(ID_ATTR);
            el.scope = function () {
                return s;
            };
            // this is the the object that has the link function in it. that is registered to the directive.
            dir = invoke(directive.fn, scope, {alias: directive.alias});
            if (dir.scope && scope === s) {
                if (id) {
                    throw new Error(app.errors.MESSAGES.E1);
                }
                if (dir.scope === true) {
                    s = createScope(dir.scope, scope, el);
                } else {
                    s = createScope(dir.scope, scope, el);
                    s.$$isolate = true;
                }
            }
            links.push(dir.link);
        }

        function findScope(el) {
            if (!el) {
                throw new Error(app.errors.MESSAGES.E2);
            }
            if (el.scope) {
                return el.scope();
            }
            return findScope(el.parentNode);
        }

        function processLink(link, index, list, el) {
            var s = el.scope();
            invoke(link, s, {scope: s, el: el});
        }

        function createWatch(scope, watch, listen, once) {
            //TODO: if once is passed then the listenerFn needs wrapped so it removes after it executes.
            var fn = listen;
            if (once) {
                fn = function (newVal, oldVal) {
                    listen.call(this, newVal, oldVal);
                    var i = scope.$$listeners.indexOf(fn);
                    if (i !== -1) {
                        scope.$$listeners.splice(i, 1);
                    }
                };
            }
            return {
                watchFn: watch,
                listenerFn: fn
            };
        }

        function createWatchers(node, index, list, scope) {
            if (node.nodeType === 3) {
                if (node.nodeValue.indexOf('{') !== -1 && !hasWatcher(scope, node)) {
                    var value = node.nodeValue,
                        watch = createWatch(scope, function () {
                            return parseBinds(value, scope);
                        }, function (newVal, oldVal) {
                            node.nodeValue = newVal;
                        });
                    watch.node = node;
                    scope.$$watchers.push(watch);
                }
            } else if (!node.getAttribute(ID_ATTR) && node.childNodes.length) {
                // keep going down the dom until you find another directive or bind.
                each(node.childNodes, createWatchers, scope);
            }
        }

        function hasWatcher(scope, node) {
            var i = 0, len = scope.$$watchers.length;
            while (i < len) {
                if (scope.$$watchers[i].node === node) {
//                    console.log('%s already has watcher on this node', scope.$id, node);
                    return true;
                }
                i += 1;
            }
            return false;
        }

        function removeChild(childEl) {
            var id = childEl.getAttribute(ID_ATTR), i = 0, p, s, len;
            if (id) {
                s = findScopeById(id);
                s.$destroy();
            } else {
                // need to remove watchers that are in this area.
                // find the parent scope and then remove any watchers that are on a node contained in this dom.
                p = childEl.parentNode;
                while (!p.getAttribute(ID_ATTR)) {
                    p = p.parentNode;
                }
                if (p && p.getAttribute(ID_ATTR)) {
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
            var s = scope || $get(app.consts.$ROOT_SCOPE), result;
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
                if (count >= app.consts.MAX_DIGESTS) {
                    throw new Error(app.errors.MESSAGES.E3 + app.consts.MAX_DIGESTS);
                }
            } while (dirty && count < app.consts.MAX_DIGESTS);
        }

        function digestOnce(scope) {
            if (scope.$$phase) {
                throw new Error(app.errors.MESSAGES.E7);
            }
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
                if (watcher.listenerFn) {
                    watcher.listenerFn(newVal, oldVal);
                }
                status.dirty = true;
            } else if (watcher.$$dirty) {
                watcher.$$dirty = false;
                watcher.listenerFn(newVal, oldVal);
            }
        }

        function filter(name, fn) {
            return $set(name, fn, 'filter');
        }

//TODO: need to make work with goDir and ngDir so that
        function directive(name, fn) {
            return $set(name, fn, 'directive');
        }

        function service(name, fn) {
            var instance = new fn();
            return $set(name, instance, 'service');
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

        function getRegistered() {
            return registered;
        }

        injector.invoke = invoke;
        injector.getInjection = getInjection;
        injector.invoke.getRegistered = getRegistered;
        injector.invoke.set = function (name, fn) {
            registered[name.toLowerCase()] = fn;
        };
        injector.invoke.get = function (name) {
            return registered[name.toLowerCase()];
        };
        return injector;
    }

//TODO: need to set references all under app name. Especially needed for unit tests.
    var modules = {};

    function module(name, deps) {
        var mod = modules[name] = modules[name] || createModule(name);
        if (deps && deps.length) {
            each(deps, function (moduleName) {
                console.log('whois', modules[moduleName].registered());
            });
        }
//        if (el) {
//            mod.element(el);
//        }
        return mod;
    }

    function createModuleFromDom(el) {
        var mod = module(el.getAttribute(APP_ATTR));
        mod.element(el);
        mod.ready();
    }

    app.framework = {
        module: module
    };

    browser.ready(function () {
        var modules = document.querySelectorAll('[' + APP_ATTR + ']');
        each(modules, createModuleFromDom);
    });


});