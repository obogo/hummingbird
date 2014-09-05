(function(exports, global) {
    global["obogo"] = exports;
    var ready = function() {
        var ary = [];
        return function(fn) {
            if (!fn) {
                while (ary.length) {
                    ary.shift()();
                }
            } else {
                ary.push(fn);
            }
        };
    }();
    var ajax = {};
    ajax.cors = function() {
        var win = window, CORSxhr = function() {
            var xhr;
            if (win.XMLHttpRequest && "withCredentials" in new win.XMLHttpRequest()) {
                xhr = win.XMLHttpRequest;
            } else if (win.XDomainRequest) {
                xhr = win.XDomainRequest;
            }
            return xhr;
        }(), methods = [ "head", "get", "post", "put", "delete" ], i = 0, methodsLength = methods.length, result = {};
        function Request(options) {
            this.init(options);
        }
        Request.prototype.init = function(options) {
            var that = this;
            that.xhr = new CORSxhr();
            that.method = options.method;
            that.url = options.url;
            that.success = options.success;
            that.error = options.error;
            that.params = JSON.stringify(options.params);
            that.headers = options.headers;
            if (options.credentials === true) {
                that.xhr.withCredentials = true;
            }
            that.send();
            return that;
        };
        Request.prototype.send = function() {
            var that = this;
            if (that.success !== undefined) {
                that.xhr.onload = function() {
                    that.success.call(this, this.responseText);
                };
            }
            if (that.error !== undefined) {
                that.xhr.error = function() {
                    that.error.call(this, this.responseText);
                };
            }
            that.xhr.open(that.method, that.url, true);
            if (that.headers !== undefined) {
                that.setHeaders();
            }
            that.xhr.send(that.params, true);
            return that;
        };
        Request.prototype.setHeaders = function() {
            var that = this, headers = that.headers, key;
            for (key in headers) {
                if (headers.hasOwnProperty(key)) {
                    that.xhr.setRequestHeader(key, headers[key]);
                }
            }
            return that;
        };
        for (i; i < methodsLength; i += 1) {
            (function() {
                var method = methods[i];
                result[method] = function(url, success) {
                    var options = {};
                    if (url === undefined) {
                        throw new Error("CORS: url must be defined");
                    }
                    if (typeof url === "object") {
                        options = url;
                    } else {
                        if (typeof success === "function") {
                            options.success = success;
                        }
                        options.url = url;
                    }
                    options.method = method.toUpperCase();
                    return new Request(options).xhr;
                };
            })();
        }
        return result;
    }();
    var app = {};
    ready(function() {
        var each = helpers.each;
        function createModule(name) {
            var rootEl;
            var injector = createInjector();
            var bootstraps = [];
            var self;
            var MAX_DIGESTS = 10;
            var elements = {};
            var prefix = "go";
            var events = "click mousedown mouseup keydown keyup".split(" ");
            var counter = 1;
            var invoke = injector.invoke;
            var $get = injector.invoke.get;
            var $set = function(name, value, type) {
                if (typeof value === "string" && value.indexOf("<") !== -1) {
                    value = value.trim();
                }
                if (typeof value === "function") {
                    value.type = type;
                }
                injector.invoke.set(name, value);
                return self;
            };
            var $apply = throttle(function() {
                var rootScope = $get("$rootScope");
                rootScope.$digest();
                rootScope.$broadcast("$digest");
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
            function on(el, event, handler) {
                if (el.attachEvent) {
                    el.attachEvent("on" + event, el[event + handler]);
                } else {
                    el.addEventListener(event, handler, false);
                }
            }
            function off(el, event, handler) {
                if (el.detachEvent) {
                    el.detachEvent("on" + event, el[event + handler]);
                } else {
                    el.removeEventListener(event, handler, false);
                }
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
                    resolve: resolve,
                    directive: directive,
                    filter: filter,
                    service: service,
                    ready: ready,
                    element: function(val) {
                        var rs = $get("$rootScope");
                        if (val !== undefined) {
                            rootEl = val;
                            rootEl.setAttribute("go-id", rs.$id);
                            elements[rs.$id] = rootEl;
                            compile(rootEl, rs);
                        }
                        return rootEl;
                    }
                };
                $set("module", self);
                var rootScope = createScope({}, null);
                $set("$rootScope", rootScope);
                rootScope.$digest = rootScope.$digest.bind(rootScope);
                self.set(prefix + "app", function() {
                    return {
                        link: function(scope, el) {}
                    };
                });
                each(events, function(eventName) {
                    self.set(prefix + eventName, function() {
                        return {
                            link: function(scope, el) {
                                function handle(evt) {
                                    interpolate(scope, this.getAttribute(prefix + "-" + eventName));
                                    scope.$apply();
                                }
                                on(el, eventName, handle);
                                scope.$$handlers.push(function() {
                                    off(el, eventName, handle);
                                });
                            }
                        };
                    }, "event");
                });
                self.set(prefix + "repeat", function() {
                    var template = "<li>item {{$index}}</li>";
                    return {
                        link: function(scope, el) {
                            function render(list, oldList) {
                                var i = 0, len = list.length, child, s;
                                while (i < len) {
                                    child = el.children[i];
                                    if (!child) {
                                        child = addChild(el, template);
                                        s = createScope({}, scope, child);
                                        compileWatchers(child, s);
                                    } else {
                                        s = child.scope();
                                    }
                                    s.item = list[i];
                                    s.$index = i;
                                    i += 1;
                                }
                                compileWatchers(el, scope);
                            }
                            scope.$watch(el.getAttribute(prefix + "-repeat"), render);
                        }
                    };
                });
                return self;
            }
            function Scope() {}
            Scope.prototype.$resolve = function(path, value) {
                return resolve(this, path, value);
            };
            Scope.prototype.$digest = function() {
                digest(this);
            };
            Scope.prototype.$destroy = function() {
                console.log("$destroy scope:%s", this.$id);
                this.$off("$destroy", this.$destroy);
                this.$broadcast("$destroy");
                while (this.$$watchers.length) this.$$watchers.pop();
                while (this.$$listeners.length) this.$$listeners.pop();
                while (this.$$handlers.length) this.$$handlers.pop()();
                if (this.$$prevSibling) {
                    this.$$prevSibling.$$nextSibling = this.$$nextSibling;
                }
                if (this.$$nextSibling) {
                    this.$$nextSibling = this.$$prevSibling;
                }
                if (this.$parent && this.$parent.$$childHead === this) {
                    this.$parent.$$childHead = this.$$nextSibling;
                }
                elements[this.$id].parentNode.removeChild(elements[this.$id]);
                delete elements[this.$id];
            };
            Scope.prototype.$emit = function(evt) {
                var s = this;
                while (s) {
                    if (s.$$listeners[evt]) {
                        each(s.$$listeners[evt], evtHandler, arguments);
                    }
                    s = s.$parent;
                }
            };
            Scope.prototype.$broadcast = function(evt) {
                if (this.$$listeners[evt]) {
                    each.apply({
                        scope: this
                    }, [ this.$$listeners[evt], evtHandler, arguments ]);
                }
                var s = this.$$childHead;
                while (s) {
                    s.$broadcast.apply(s, arguments);
                    s = s.$$nextSibling;
                }
            };
            Scope.prototype.$on = function(evt, fn) {
                var self = this;
                self.$$listeners[evt] = self.$$listeners[evt] || [];
                self.$$listeners[evt].push(fn);
                return function() {
                    var ary = self.$$listeners[evt], index = ary.indexOf(fn);
                    if (index !== -1) {
                        ary.splice(index, 1);
                    }
                };
            };
            Scope.prototype.$off = function(evt, fn) {
                var list = this.$$listeners[evt], i = 0, len = list.length;
                while (i < len) {
                    if (!fn || fn && list[i] === fn) {
                        list.splice(i, 1);
                        i -= 1;
                        len -= 1;
                    }
                    i += 1;
                }
            };
            Scope.prototype.$watch = function(strOrFn, fn) {
                var me = this, watch;
                if (typeof strOrFn === "string") {
                    watch = function() {
                        return me[strOrFn];
                    };
                } else {
                    watch = strOrFn;
                }
                me.$$watchers.push(createWatch(watch, fn));
            };
            Scope.prototype.$apply = $apply;
            function evtHandler(fn, index, list, args) {
                fn.apply(this, args);
            }
            function createScope(obj, parentScope, el) {
                var s = new Scope();
                extend(s, obj);
                s.$id = name + "-" + (counter++).toString(16);
                console.log(s.$id);
                s.$parent = parentScope;
                if (parentScope) {
                    if (!parentScope.$$childHead) {
                        parentScope.$$childHead = s;
                    }
                    s.$$prevSibling = parentScope.$$childTail;
                    if (s.$$prevSibling) {
                        s.$$prevSibling.$$nextSibling = s;
                    }
                    parentScope.$$childTail = s;
                }
                s.$$watchers = [];
                s.$$listeners = [];
                s.$$handlers = [];
                s.$on("$destroy", s.$destroy);
                if (el) {
                    el.setAttribute("go-id", s.$id);
                    el.scope = function() {
                        return s;
                    };
                    elements[s.$id] = el;
                }
                return s;
            }
            function resolve(object, path, value) {
                path = path || "";
                var stack = path.match(/(\w|\$)+/g), property;
                var isGetter = typeof value === "undefined";
                while (stack.length > 1) {
                    property = stack.shift();
                    switch (typeof object[property]) {
                      case "object":
                        object = object[property];
                        break;

                      case "undefined":
                        if (isGetter) {
                            return;
                        }
                        object = object[property] = {};
                        break;

                      default:
                        throw new Error("property is not of type object", property);
                    }
                }
                if (typeof value === "undefined") {
                    return object[stack.shift()];
                }
                object[stack.shift()] = value;
                return value;
            }
            function html2dom(html) {
                var container = document.createElement("div");
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
                var fn = Function, filter = parseFilter(str, scope), result;
                str = filter ? filter.str : str;
                result = new fn("var result; try { result = this." + str + "; } catch(er) { result = er; } finally { return result; }").apply(scope);
                if (result === undefined && scope.$parent && !scope.$$isolate) {
                    return interpolate(scope.$parent, str);
                } else if (typeof result === "object" && (result.hasOwnProperty("stack") || result.hasOwnProperty("stacktrace") || result.hasOwnProperty("backtrace"))) {
                    if (scope.$parent && !scope.$$isolate) {
                        return interpolate(scope.$parent, str);
                    }
                    interpolateError(result, scope, str, errorHandler);
                }
                if (result + "" === "NaN") {
                    result = "";
                }
                return filter ? filter.filter(result) : result;
            }
            function defaultErrorHandler(er, extraMessage, data) {
                if (window.console && console.warn) {
                    console.warn(extraMessage + "\n" + er.message + "\n" + (er.stack || er.stacktrace || er.backtrace), data);
                }
            }
            function parseFilter(str, scope) {
                if (str.indexOf("|") !== -1) {
                    var parts = str.split("|");
                    parts[1] = parts[1].trim().split(":");
                    var filter = $get(parts[1].shift().trim())(), args = parts[1];
                    each(args, injector.getInjection, scope);
                    return {
                        filter: function(value) {
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
                    return str.replace(/{{([^{}]*)}}/g, function(a, b) {
                        var r = interpolate(o, b.trim());
                        return typeof r === "string" || typeof r === "number" ? r : "";
                    });
                }
                return str;
            }
            function view(name) {
                var tpl = $get(name);
                return tpl ? html2dom(tpl) : null;
            }
            function addChild(parentEl, childEl) {
                if (parentEl !== rootEl && rootEl.contains && !rootEl.contains(parentEl)) {
                    throw new Error("parent element not found in %o", rootEl);
                }
                parentEl.insertAdjacentHTML("beforeend", childEl.outerHTML || childEl);
                var scope = findScope(parentEl), child = compile(parentEl.children[parentEl.children.length - 1], scope), s = child.scope && child.scope();
                if (s && s.$parent) {
                    compileWatchers(elements[s.$parent.$id], s.$parent);
                }
                return child;
            }
            function findDirectives(el) {
                var attrs = el.attributes, result = [];
                each(attrs, getDirectiveFromAttr, result);
                return result;
            }
            function getDirectiveFromAttr(attr, index, list, result) {
                var name = attr ? attr.name.split("-").join("") : "", dr;
                if (dr = $get(name)) {
                    result.push(dr);
                }
            }
            function compile(el, scope) {
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
                    if (el.getAttribute("go-id")) {
                        compileWatchers(el, scope);
                    }
                    $get("$rootScope").$digest();
                }
                return el;
            }
            function compileWatchers(el, scope) {
                each(el.childNodes, createWatchers, scope);
            }
            function compileChild(el, index, list, scope) {
                compile(el, scope);
            }
            function compileDirective(directive, index, list, el, scope, links) {
                var s = el.scope ? el.scope() : scope;
                var dir, id = el.getAttribute("go-id");
                el.scope = function() {
                    return s;
                };
                dir = invoke(directive, this, {});
                if (dir.scope && scope === s) {
                    if (id) {
                        throw new Error("Trying to assign multiple scopes to the same dom element is not permitted.");
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
                    throw new Error("Unable to find element");
                }
                if (el.scope) {
                    return el.scope();
                }
                return findScope(el.parentNode);
            }
            function processLink(link, index, list, el) {
                var s = el.scope();
                invoke(link, s, {
                    scope: s,
                    el: el
                });
            }
            function createWatch(watch, listen) {
                return {
                    watchFn: watch,
                    listenerFn: listen
                };
            }
            function createWatchers(node, index, list, scope) {
                if (node.nodeType === 3) {
                    if (node.nodeValue.indexOf("{") !== -1 && !hasWatcher(scope, node)) {
                        var value = node.nodeValue, watch = createWatch(function() {
                            return supplant(value, scope);
                        }, function(newVal, oldVal) {
                            node.nodeValue = newVal;
                        });
                        watch.node = node;
                        scope.$$watchers.push(watch);
                    }
                } else if (!node.getAttribute("go-id") && node.childNodes.length) {
                    each(node.childNodes, createWatchers, scope);
                }
            }
            function hasWatcher(scope, node) {
                var i = 0, len = scope.$$watchers.length;
                while (i < len) {
                    if (scope.$$watchers[i].node === node) {
                        console.log("%s already has watcher on this node", scope.$id, node);
                        return true;
                    }
                    i += 1;
                }
                return false;
            }
            function removeChild(childEl) {
                var id = childEl.getAttribute("go-id"), i = 0, p, s, len;
                if (id) {
                    s = findScopeById(id);
                    s.$destroy();
                } else {
                    p = childEl.parentNode;
                    while (!p.getAttribute("go-id")) {
                        p = p.parentNode;
                    }
                    if (p && p.getAttribute("go-id")) {
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
                var s = scope || $get("$rootScope"), result;
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
                var child = scope.$$childHead, next, status = {
                    dirty: false
                };
                scope.$$phase = "digest";
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
                return $set(name, fn, "filter");
            }
            function directive(name, fn) {
                return $set(name, fn, "directive");
            }
            function service(name, fn) {
                var instance = new fn();
                return $set(name, instance, "service");
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
            injector.invoke.set = function(name, fn) {
                registered[name.toLowerCase()] = fn;
            };
            injector.invoke.get = function(name) {
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
            return function() {
                if (pause) {
                    args = arguments;
                    return;
                }
                pause = 1;
                fn.apply(fn, arguments);
                setTimeout(function() {
                    pause = 0;
                    if (args) {
                        fn.apply(fn, args);
                    }
                }, delay);
            };
        }
        var modules = {};
        function module(name, el) {
            var mod = modules[name] = modules[name] || createModule(name);
            if (el) {
                mod.element(el);
            }
            return mod;
        }
        function createModuleFromDom(el) {
            var mod = module(el.getAttribute("go-app"), el);
            mod.ready();
        }
        app.framework = {
            module: module
        };
        browser.ready(function() {
            var modules = document.querySelectorAll("[go-app]");
            each(modules, createModuleFromDom);
        });
    });
    var browser = {};
    (function() {
        var callbacks = [], win = window, doc = document, ADD_EVENT_LISTENER = "addEventListener", REMOVE_EVENT_LISTENER = "removeEventListener", ATTACH_EVENT = "attachEvent", DETACH_EVENT = "detachEvent", DOM_CONTENT_LOADED = "DOMContentLoaded", ON_READY_STATE_CHANGE = "onreadystatechange", COMPLETE = "complete", READY_STATE = "readyState";
        browser.ready = function(callback) {
            callbacks.push(callback);
        };
        var DOMContentLoaded;
        function invokeCallbacks() {
            var i = 0, len = callbacks.length;
            while (i < len) {
                callbacks[i]();
                i += 1;
            }
            callbacks.length = 0;
        }
        if (doc[ADD_EVENT_LISTENER]) {
            DOMContentLoaded = function() {
                doc[REMOVE_EVENT_LISTENER](DOM_CONTENT_LOADED, DOMContentLoaded, false);
                invokeCallbacks();
            };
        } else if (doc.attachEvent) {
            DOMContentLoaded = function() {
                if (doc[READY_STATE] === COMPLETE) {
                    doc[DETACH_EVENT](ON_READY_STATE_CHANGE, DOMContentLoaded);
                    invokeCallbacks();
                }
            };
        }
        if (doc[READY_STATE] === COMPLETE) {
            setTimeout(invokeCallbacks, 1);
        }
        if (doc[ADD_EVENT_LISTENER]) {
            doc[ADD_EVENT_LISTENER](DOM_CONTENT_LOADED, DOMContentLoaded, false);
            win[ADD_EVENT_LISTENER]("load", invokeCallbacks, false);
        } else if (doc[ATTACH_EVENT]) {
            doc[ATTACH_EVENT](ON_READY_STATE_CHANGE, DOMContentLoaded);
            win[ATTACH_EVENT]("onload", invokeCallbacks);
        }
    })();
    var helpers = {};
    helpers.each = function(list, method) {
        var i = 0, len, result, extraArgs;
        if (arguments.length > 2) {
            extraArgs = Array.prototype.slice.apply(arguments);
            extraArgs.splice(0, 2);
        }
        if (list && list.length && list.hasOwnProperty(0)) {
            len = list.length;
            while (i < len) {
                result = method.apply(this.scope, [ list[i], i, list ].concat(extraArgs));
                if (result !== undefined) {
                    return result;
                }
                i += 1;
            }
        } else if (!(list instanceof Array) && list.length === undefined) {
            for (i in list) {
                if (list.hasOwnProperty(i) && (!this.omit || !this.omit[i])) {
                    result = method.apply(this.scope, [ list[i], i, list ].concat(extraArgs));
                    if (result !== undefined) {
                        return result;
                    }
                }
            }
        }
        return list;
    };
    var query;
    (function() {
        var fn;
        function Query(selector, context) {
            this.init(selector, context);
        }
        var queryPrototype = Query.prototype = Object.create(Array.prototype);
        queryPrototype.version = "0.1.2";
        queryPrototype.selector = "";
        queryPrototype.init = function(selector, context) {
            if (typeof selector === "string") {
                if (selector.substr(0, 1) === "<" && selector.substr(selector.length - 1, 1) === ">") {
                    this.parseHTML(selector);
                } else {
                    this.parseSelector(selector, context);
                }
            } else if (selector instanceof Array) {
                this.parseArray(selector);
            } else if (selector instanceof Element) {
                this.parseElement(selector);
            }
        };
        queryPrototype.parseHTML = function(html) {
            var container = document.createElement("div");
            container.innerHTML = html;
            this.length = 0;
            this.parseArray(container.children);
        };
        queryPrototype.parseSelector = function(selector, context) {
            var i, nodes, len;
            this.selector = selector;
            if (context instanceof Element) {
                this.context = context;
            } else if (context instanceof Query) {
                this.context = context[0];
            } else {
                this.context = document;
            }
            nodes = this.context.querySelectorAll(selector);
            len = nodes.length;
            i = 0;
            this.length = 0;
            while (i < len) {
                this.push(nodes[i]);
                i += 1;
            }
        };
        queryPrototype.parseArray = function(list) {
            var i = 0, len = list.length;
            this.length = 0;
            while (i < len) {
                if (list[i] instanceof Element) {
                    this.push(list[i]);
                }
                i += 1;
            }
        };
        queryPrototype.parseElement = function(element) {
            this.length = 0;
            this.push(element);
        };
        queryPrototype.toString = function() {
            if (this.length) {
                return this[0].outerHTML;
            }
        };
        queryPrototype.each = function(fn) {
            var i = 0, len = this.length, result;
            while (i < len) {
                result = fn.apply(this[i], [ i, this[i] ]);
                if (result === false) {
                    break;
                }
                i += 1;
            }
            return this;
        };
        query = function(selector, context) {
            for (var n in query.fn) {
                if (query.fn.hasOwnProperty(n)) {
                    queryPrototype[n] = query.fn[n];
                    delete query.fn[n];
                }
            }
            return new Query(selector, context);
        };
        query.fn = {};
    })();
    query.fn.bind = query.fn.on = function(events, handler) {
        events = events.match(/\w+/gim);
        var i = 0, event, len = events.length;
        while (i < len) {
            event = events[i];
            this.each(function(index, el) {
                if (el.attachEvent) {
                    el["e" + event + handler] = handler;
                    el[event + handler] = function() {
                        el["e" + event + handler](window.event);
                    };
                    el.attachEvent("on" + event, el[event + handler]);
                } else {
                    el.addEventListener(event, handler, false);
                }
                if (!el.eventHolder) {
                    el.eventHolder = [];
                }
                el.eventHolder[el.eventHolder.length] = [ event, handler ];
            });
            i += 1;
        }
        return this;
    };
    query.fn.unbind = query.fn.off = function(events, handler) {
        if (arguments.length === 1) {
            this.unbindAll(events);
        } else {
            events = events.match(/\w+/gim);
            var i = 0, event, len = events.length;
            while (i < len) {
                event = events[i];
                this.each(function(index, el) {
                    if (el.detachEvent) {
                        el.detachEvent("on" + event, el[event + handler]);
                        el[event + handler] = null;
                    } else {
                        el.removeEventListener(event, handler, false);
                    }
                });
            }
        }
        return this;
    };
    query.fn.unbindAll = function(event) {
        var scope = this;
        events = events.match(/\w+/gim);
        var i = 0, event, len = events.length;
        while (i < len) {
            event = events[i];
            this.each(function(index, el) {
                if (el.eventHolder) {
                    var removed = 0, handler;
                    for (var i = 0; i < el.eventHolder.length; i++) {
                        if (el.eventHolder[i][0] === event) {
                            handler = el.eventHolder[i][1];
                            scope.off(el, event, handler);
                            if (el.detachEvent) {
                                el.detachEvent("on" + event, el[event + handler]);
                                el[event + handler] = null;
                            } else {
                                el.removeEventListener(event, handler, false);
                            }
                            el.eventHolder.splice(i, 1);
                            removed += 1;
                            i -= 1;
                        }
                    }
                }
            });
        }
        return this;
    };
    ready();
    exports["ready"] = ready;
    exports["ajax"] = ajax;
    exports["app"] = app;
    exports["browser"] = browser;
    exports["helpers"] = helpers;
    exports["query"] = query;
})({}, function() {
    return this;
}());