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
    var app = {};
    app.consts = {
        PREFIX: "go",
        MAX_DIGESTS: 10,
        $DESTROY: "$destroy",
        $ROOT_SCOPE: "$rootScope"
    };
    app.directives = {};
    (function() {
        console.log("###events");
        var UI_EVENTS = "click mousedown mouseup keydown keyup touchstart touchend touchmove".split(" ");
        var ON_STR = "on";
        function on(el, event, handler) {
            if (el.attachEvent) {
                el.attachEvent(ON_STR + event, el[event + handler]);
            } else {
                el.addEventListener(event, handler, false);
            }
        }
        function off(el, event, handler) {
            if (el.detachEvent) {
                el.detachEvent(ON_STR + event, el[event + handler]);
            } else {
                el.removeEventListener(event, handler, false);
            }
        }
        app.directives.events = function(module) {
            helpers.each(UI_EVENTS, function(eventName) {
                module.set(app.consts.PREFIX + eventName, function(alias) {
                    return {
                        link: function(scope, el) {
                            function handle(evt) {
                                if (evt.target.nodeName.toLowerCase() === "a") {
                                    evt.preventDefault();
                                }
                                app.interpolate(scope, el.getAttribute(alias));
                                scope.$apply();
                                return false;
                            }
                            on(el, eventName, handle);
                            scope.$$handlers.push(function() {
                                off(el, eventName, handle);
                            });
                        }
                    };
                }, "event");
            });
        };
    })();
    app.errors = {};
    app.errors.MESSAGES = {
        E1: "Trying to assign multiple scopes to the same dom element is not permitted.",
        E2: "Unable to find element",
        E3: "Exceeded max digests of ",
        E4: "parent element not found in %o",
        E5: "property is not of type object",
        E6a: 'Error evaluating: "',
        E6b: '" against %o',
        E7: "$digest already in progress."
    };
    ready(function() {
        "use strict";
        var each = helpers.each;
        var PREFIX = "go";
        var ID_ATTR = PREFIX + "-id";
        var APP_ATTR = PREFIX + "-app";
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
            var $set = function(name, value, type) {
                each(name.split(" "), setSingle, value, type);
                return self;
            };
            var setSingle = function(name, index, list, value, type) {
                if (typeof value === "string" && value.indexOf("<") !== -1) {
                    value = value.trim();
                }
                if (typeof value === "function") {
                    value.type = type;
                }
                injector.invoke.set(name, value);
            };
            var $apply = app.utils.throttle(function(val) {
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
                    element: function(val) {
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
                $set("module", self);
                var rootScope = createScope({}, null);
                $set(app.consts.$ROOT_SCOPE, rootScope);
                rootScope.$digest = rootScope.$digest.bind(rootScope);
                self.set(PREFIX + "app", function() {
                    return {
                        link: function(scope, el) {}
                    };
                });
                app.directives.events(self);
                self.set(PREFIX + "if", function(alias) {
                    return {
                        scope: true,
                        link: function(scope, el) {
                            var display, enabled = true;
                            function enable() {
                                if (!enabled) {
                                    enabled = true;
                                    moveListeners(scope.$$$listeners, scope.$$listeners);
                                    scope.$$childHead = scope.$$$childHead;
                                    scope.$$childTail = scope.$$$childTail;
                                    el.style.display = display;
                                }
                            }
                            function disable() {
                                if (enabled) {
                                    enabled = false;
                                    moveListeners(scope.$$listeners, scope.$$$listeners);
                                    scope.$$$childHead = scope.$$childHead;
                                    scope.$$childHead = null;
                                    scope.$$$childTail = scope.$$childTail;
                                    scope.$$childTail = null;
                                    display = el.style.display;
                                    el.style.display = "none";
                                }
                            }
                            function moveListeners(list, target) {
                                var i = 0, len = list.length;
                                while (i < len) {
                                    if (!list[i].keep) {
                                        target.push(list.splice(i, 1));
                                        i -= 1;
                                        len -= 1;
                                    }
                                    i += 1;
                                }
                            }
                            scope.$watch(el.getAttribute(alias), function(newVal, oldVal) {
                                if (newVal) {
                                    enable();
                                } else {
                                    disable();
                                }
                            });
                            scope.$$watchers[0].keep = true;
                            scope.$$$listeners = [];
                            scope.$on("$destroy", function() {
                                scope.enable();
                                delete scope.$$$listeners;
                            });
                        }
                    };
                });
                self.set(PREFIX + "repeat ngRepeat", function(alias) {
                    return {
                        link: function(scope, el) {
                            var template = el.children[0].outerHTML;
                            el.removeChild(el.children[0]);
                            var statement = el.getAttribute(alias);
                            statement = each(statement.split(/\s+in\s+/), trimStr);
                            var itemName = statement[0], watch = statement[1];
                            function render(list, oldList) {
                                var i = 0, len = Math.max(list.length, el.children.length), child, s;
                                while (i < len) {
                                    child = el.children[i];
                                    if (!child) {
                                        el.insertAdjacentHTML("beforeend", formatters.stripHTMLComments(template));
                                        child = el.children[el.children.length - 1];
                                        child.setAttribute(PREFIX + "-repeat-item", "");
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
                self.set(PREFIX + "RepeatItem", function() {
                    return {
                        scope: true,
                        link: function(scope, el) {}
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
                        var result = interpolate(me, strOrFn);
                        if (result && result.$$dirty) {
                            delete result.$$dirty;
                            this.$$dirty = true;
                        }
                        return result;
                    };
                } else {
                    watch = strOrFn;
                }
                me.$$watchers.push(createWatch(me, watch, fn));
            };
            Scope.prototype.$watchOnce = function(strOrFn, fn) {
                return this.$watch(strOrFn, fn, true);
            };
            Scope.prototype.$apply = $apply;
            function evtHandler(fn, index, list, args) {
                fn.apply(this, args);
            }
            function createScope(obj, parentScope, el) {
                var s = new Scope();
                app.utils.extend(s, obj);
                s.$id = name + "-" + (counter++).toString(16);
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
                        throw new Error(app.errors.MESSAGES.E5, property);
                    }
                }
                if (typeof value === "undefined") {
                    return object[stack.shift()];
                }
                object[stack.shift()] = value;
                return value;
            }
            function interpolateError(er, scope, str, errorHandler) {
                var eh = errorHandler || defaultErrorHandler;
                if (eh) {
                    eh(er, app.errors.MESSAGES.E6a + str + app.errors.MESSAGES.E6b, scope);
                }
            }
            function fixStrReferences(str, scope) {
                var c = 0, matches = [], i = 0, len;
                str = str.replace(/('|").*?\1/g, function(str, p1, offset, wholeString) {
                    var result = "*" + c;
                    matches.push(str);
                    c += 1;
                    return result;
                });
                str = str.replace(/\b(\.?[a-zA-z]\w+)/g, function(str, p1, offset, wholeString) {
                    if (str.charAt(0) === ".") {
                        return str;
                    }
                    return lookupStrDepth(str, scope);
                });
                len = matches.length;
                while (i < len) {
                    str = str.split("*" + i).join(matches[i]);
                    i += 1;
                }
                return str;
            }
            function lookupStrDepth(str, scope) {
                var ary = [ "this" ];
                while (scope && scope[str] === undefined) {
                    scope = scope.$parent;
                    ary.push("$parent");
                }
                if (scope && scope[str]) {
                    return ary.join(".") + "." + str;
                }
                return "this." + str;
            }
            function interpolate(scope, str, errorHandler) {
                str = formatters.stripLineBreaks(str);
                str = formatters.stripLineBreaks(str);
                var fn = Function, filter = parseFilter(str, scope), result;
                str = filter ? filter.str : str;
                str = fixStrReferences(str, scope);
                result = new fn("var result; try { result = " + str + "; } catch(er) { result = er; } finally { return result; }").apply(scope);
                if (typeof result === "object" && (result.hasOwnProperty("stack") || result.hasOwnProperty("stacktrace") || result.hasOwnProperty("backtrace"))) {
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
            function trimStr(str, index, list) {
                list[index] = str && str.trim();
            }
            function parseFilter(str, scope) {
                if (str.indexOf("|") !== -1 && str.match(/\w+\s?\|\s?\w+/)) {
                    str = str.replace("||", "~~");
                    var parts = str.trim().split("|");
                    parts[1] = parts[1].replace("~~", "||");
                    each(parts, trimStr);
                    parts[1] = parts[1].trim().split(":");
                    var filterName = parts[1].shift(), filter = $get(filterName), args;
                    if (!filter) {
                        return parts[0];
                    } else {
                        args = parts[1];
                    }
                    each(args, injector.getInjection, scope);
                    return {
                        filter: function(value) {
                            args.unshift(value);
                            return invoke(filter, scope, {
                                alias: filterName
                            }).apply(scope, args);
                        },
                        str: parts[0]
                    };
                }
                return undefined;
            }
            function parseBinds(str, o) {
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
                return tpl ? parsers.htmlToDOM(tpl) : null;
            }
            function addChild(parentEl, childEl) {
                if (parentEl !== rootEl && rootEl.contains && !rootEl.contains(parentEl)) {
                    throw new Error(app.errors.MESSAGES.E4, rootEl);
                }
                parentEl.insertAdjacentHTML("beforeend", formatters.stripHTMLComments(childEl.outerHTML || childEl));
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
                    result.push({
                        fn: dr,
                        alias: attr.name
                    });
                }
            }
            function removeComments(el, index, list, parent) {
                if (el) {
                    if (el.nodeType === 8) {
                        parent.removeChild(el);
                    } else if (el.childNodes) {
                        each(el.childNodes, removeComments, el);
                    }
                } else {
                    return true;
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
                        compileWatchers(el, scope);
                    }
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
                var dir, id = el.getAttribute(ID_ATTR);
                el.scope = function() {
                    return s;
                };
                dir = invoke(directive.fn, scope, {
                    alias: directive.alias
                });
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
                invoke(link, s, {
                    scope: s,
                    el: el
                });
            }
            function createWatch(scope, watch, listen, once) {
                var fn = listen;
                if (once) {
                    fn = function(newVal, oldVal) {
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
                    if (node.nodeValue.indexOf("{") !== -1 && !hasWatcher(scope, node)) {
                        var value = node.nodeValue, watch = createWatch(scope, function() {
                            return parseBinds(value, scope);
                        }, function(newVal, oldVal) {
                            node.nodeValue = newVal;
                        });
                        watch.node = node;
                        scope.$$watchers.push(watch);
                    }
                } else if (!node.getAttribute(ID_ATTR) && node.childNodes.length) {
                    each(node.childNodes, createWatchers, scope);
                }
            }
            function hasWatcher(scope, node) {
                var i = 0, len = scope.$$watchers.length;
                while (i < len) {
                    if (scope.$$watchers[i].node === node) {
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
            function getRegistered() {
                return registered;
            }
            injector.invoke = invoke;
            injector.getInjection = getInjection;
            injector.invoke.getRegistered = getRegistered;
            injector.invoke.set = function(name, fn) {
                registered[name.toLowerCase()] = fn;
            };
            injector.invoke.get = function(name) {
                return registered[name.toLowerCase()];
            };
            return injector;
        }
        var modules = {};
        function module(name, deps) {
            var mod = modules[name] = modules[name] || createModule(name);
            if (deps && deps.length) {
                each(deps, function(moduleName) {
                    console.log("whois", modules[moduleName].registered());
                });
            }
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
        browser.ready(function() {
            var modules = document.querySelectorAll("[" + APP_ATTR + "]");
            each(modules, createModuleFromDom);
        });
    });
    (function() {
        function parseFilter(str, scope) {
            if (str.indexOf("|") !== -1 && str.match(/\w+\s?\|\s?\w+/)) {
                str = str.replace("||", "~~");
                var parts = str.trim().split("|");
                parts[1] = parts[1].replace("~~", "||");
                helpers.each(parts, trimStr);
                parts[1] = parts[1].trim().split(":");
                var filterName = parts[1].shift(), filter = $get(filterName), args;
                if (!filter) {
                    return parts[0];
                } else {
                    args = parts[1];
                }
                helpers.each(args, injector.getInjection, scope);
                return {
                    filter: function(value) {
                        args.unshift(value);
                        return invoke(filter, scope, {
                            alias: filterName
                        }).apply(scope, args);
                    },
                    str: parts[0]
                };
            }
            return undefined;
        }
        function interpolateError(er, scope, str, errorHandler) {
            var eh = errorHandler || defaultErrorHandler;
            if (eh) {
                eh(er, MESSAGES.E6a + str + MESSAGES.E6b, scope);
            }
        }
        function fixStrReferences(str, scope) {
            var c = 0, matches = [], i = 0, len;
            str = str.replace(/('|").*?\1/g, function(str, p1, offset, wholeString) {
                var result = "*" + c;
                matches.push(str);
                c += 1;
                return result;
            });
            str = str.replace(/\b(\.?[a-zA-z]\w+)/g, function(str, p1, offset, wholeString) {
                if (str.charAt(0) === ".") {
                    return str;
                }
                return lookupStrDepth(str, scope);
            });
            len = matches.length;
            while (i < len) {
                str = str.split("*" + i).join(matches[i]);
                i += 1;
            }
            return str;
        }
        function lookupStrDepth(str, scope) {
            var ary = [ "this" ];
            while (scope && scope[str] === undefined) {
                scope = scope.$parent;
                ary.push("$parent");
            }
            if (scope && scope[str]) {
                return ary.join(".") + "." + str;
            }
            return "this." + str;
        }
        app.interpolate = function(scope, str, errorHandler) {
            str = formatters.stripLineBreaks(str);
            str = formatters.stripLineBreaks(str);
            var fn = Function, filter = parseFilter(str, scope), result;
            str = filter ? filter.str : str;
            str = fixStrReferences(str, scope);
            result = new fn("var result; try { result = " + str + "; } catch(er) { result = er; } finally { return result; }").apply(scope);
            if (typeof result === "object" && (result.hasOwnProperty("stack") || result.hasOwnProperty("stacktrace") || result.hasOwnProperty("backtrace"))) {
                interpolateError(result, scope, str, errorHandler);
            }
            if (result + "" === "NaN") {
                result = "";
            }
            return filter ? filter.filter(result) : result;
        };
    })();
    app.utils = {};
    app.utils.extend = function(target, source) {
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
    };
    app.utils.throttle = function(fn, delay) {
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
    };
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
    var formatters = {};
    formatters.stripHTMLComments = function(htmlStr) {
        htmlStr = htmlStr + "";
        return htmlStr.replace(/<!--[\s\S]*?-->/g, "");
    };
    formatters.stripLineBreaks = function(str) {
        str = str + "";
        return str.replace(/\s+/g, " ");
    };
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
    var parsers = {};
    parsers.htmlify = function() {
        function htmlify($text) {
            var tlnk = [];
            var hlnk = [];
            var ac, htm;
            $text = specialCharsToHtml($text);
            var i = 0;
            for (i = 0; i < 4; i++) {
                $text = $text.replace(/(\S+\.\S+)/, "<" + i + ">");
                tlnk[i] = RegExp.$1;
            }
            ac = i;
            for (i = 0; i < ac; i++) {
                if (tlnk[i].search(/\d\.\d/) > -1 || tlnk[i].length < 5) {
                    $text = $text.replace("<" + i + ">", tlnk[i]);
                } else {
                    htm = linkify(tlnk[i]);
                    $text = $text.replace("<" + i + ">", htm);
                }
            }
            $text = $text.replace(/\n/g, "<br/>");
            $text = $text.replace(/\ \ /g, " &nbsp;");
            $text = $text.replace(/"/g, "&quot;");
            $text = $text.replace(/\$/g, "&#36;");
            return $text;
        }
        function linkify(txt) {
            txt = htmlToSpecialChars(txt);
            var i = 0, pN, ch, prea, posta, turl, tlnk, hurl;
            pN = txt.length - 1;
            for (i = 0; i < pN; i++) {
                ch = txt.substr(i, 1);
                if (ch.search(/\w/) > -1) {
                    break;
                }
            }
            prea = txt.substring(0, i);
            prea = specialCharsToHtml(prea);
            txt = txt.substr(i);
            for (i = pN; i > 0; i--) {
                ch = txt.substr(i, 1);
                if (ch.search(/\w|_|-|\//) > -1) {
                    break;
                }
            }
            posta = txt.substring(i + 1);
            posta = specialCharsToHtml(posta);
            turl = txt.substring(0, i + 1);
            if (turl.search(/@/) > 0) {
                tlnk = '<a href="mailto:' + turl + '">' + turl + "</a>";
                return prea + tlnk + posta;
            }
            hurl = "";
            if (turl.search(/\w+:\/\//) < 0) {
                hurl = "http://";
            }
            tlnk = '<a href="' + hurl + turl + '">' + turl + "</a>";
            return prea + tlnk + posta;
        }
        function specialCharsToHtml(str) {
            str = str.replace(/&/g, "&amp;");
            str = str.replace(/</g, "&lt;");
            str = str.replace(/>/g, "&gt;");
            return str;
        }
        function htmlToSpecialChars(str) {
            str = str.replace(/&lt;/g, "<");
            str = str.replace(/&gt;/g, ">");
            str = str.replace(/&amp;/g, "&");
            return str;
        }
        return htmlify;
    }();
    parsers.htmlToDOM = function(htmlStr) {
        var container = document.createElement("div");
        container.innerHTML = htmlStr;
        return container.firstChild;
    };
    parsers.interpolate = function() {
        function setter(obj, path, setValue, fullExp, options) {
            options = options || {};
            var element = path.split("."), key;
            for (var i = 0; element.length > 1; i++) {
                key = ensureSafeMemberName(element.shift(), fullExp);
                var propertyObj = obj[key];
                if (!propertyObj) {
                    propertyObj = {};
                    obj[key] = propertyObj;
                }
                obj = propertyObj;
                if (obj.then && options.unwrapPromises) {
                    promiseWarning(fullExp);
                    if (!("$$v" in obj)) {
                        (function(promise) {
                            promise.then(function(val) {
                                promise.$$v = val;
                            });
                        })(obj);
                    }
                    if (obj.$$v === undefined) {
                        obj.$$v = {};
                    }
                    obj = obj.$$v;
                }
            }
            key = ensureSafeMemberName(element.shift(), fullExp);
            obj[key] = setValue;
            return setValue;
        }
        var getterFnCache = {};
        function cspSafeGetterFn(key0, key1, key2, key3, key4, fullExp, options) {
            ensureSafeMemberName(key0, fullExp);
            ensureSafeMemberName(key1, fullExp);
            ensureSafeMemberName(key2, fullExp);
            ensureSafeMemberName(key3, fullExp);
            ensureSafeMemberName(key4, fullExp);
            return !options.unwrapPromises ? function cspSafeGetter(scope, locals) {
                var pathVal = locals && locals.hasOwnProperty(key0) ? locals : scope;
                if (pathVal == null) return pathVal;
                pathVal = pathVal[key0];
                if (!key1) return pathVal;
                if (pathVal == null) return undefined;
                pathVal = pathVal[key1];
                if (!key2) return pathVal;
                if (pathVal == null) return undefined;
                pathVal = pathVal[key2];
                if (!key3) return pathVal;
                if (pathVal == null) return undefined;
                pathVal = pathVal[key3];
                if (!key4) return pathVal;
                if (pathVal == null) return undefined;
                pathVal = pathVal[key4];
                return pathVal;
            } : function cspSafePromiseEnabledGetter(scope, locals) {
                var pathVal = locals && locals.hasOwnProperty(key0) ? locals : scope, promise;
                if (pathVal == null) return pathVal;
                pathVal = pathVal[key0];
                if (pathVal && pathVal.then) {
                    promiseWarning(fullExp);
                    if (!("$$v" in pathVal)) {
                        promise = pathVal;
                        promise.$$v = undefined;
                        promise.then(function(val) {
                            promise.$$v = val;
                        });
                    }
                    pathVal = pathVal.$$v;
                }
                if (!key1) return pathVal;
                if (pathVal == null) return undefined;
                pathVal = pathVal[key1];
                if (pathVal && pathVal.then) {
                    promiseWarning(fullExp);
                    if (!("$$v" in pathVal)) {
                        promise = pathVal;
                        promise.$$v = undefined;
                        promise.then(function(val) {
                            promise.$$v = val;
                        });
                    }
                    pathVal = pathVal.$$v;
                }
                if (!key2) return pathVal;
                if (pathVal == null) return undefined;
                pathVal = pathVal[key2];
                if (pathVal && pathVal.then) {
                    promiseWarning(fullExp);
                    if (!("$$v" in pathVal)) {
                        promise = pathVal;
                        promise.$$v = undefined;
                        promise.then(function(val) {
                            promise.$$v = val;
                        });
                    }
                    pathVal = pathVal.$$v;
                }
                if (!key3) return pathVal;
                if (pathVal == null) return undefined;
                pathVal = pathVal[key3];
                if (pathVal && pathVal.then) {
                    promiseWarning(fullExp);
                    if (!("$$v" in pathVal)) {
                        promise = pathVal;
                        promise.$$v = undefined;
                        promise.then(function(val) {
                            promise.$$v = val;
                        });
                    }
                    pathVal = pathVal.$$v;
                }
                if (!key4) return pathVal;
                if (pathVal == null) return undefined;
                pathVal = pathVal[key4];
                if (pathVal && pathVal.then) {
                    promiseWarning(fullExp);
                    if (!("$$v" in pathVal)) {
                        promise = pathVal;
                        promise.$$v = undefined;
                        promise.then(function(val) {
                            promise.$$v = val;
                        });
                    }
                    pathVal = pathVal.$$v;
                }
                return pathVal;
            };
        }
        function simpleGetterFn1(key0, fullExp) {
            ensureSafeMemberName(key0, fullExp);
            return function simpleGetterFn1(scope, locals) {
                if (scope == null) return undefined;
                return (locals && locals.hasOwnProperty(key0) ? locals : scope)[key0];
            };
        }
        function simpleGetterFn2(key0, key1, fullExp) {
            ensureSafeMemberName(key0, fullExp);
            ensureSafeMemberName(key1, fullExp);
            return function simpleGetterFn2(scope, locals) {
                if (scope == null) return undefined;
                scope = (locals && locals.hasOwnProperty(key0) ? locals : scope)[key0];
                return scope == null ? undefined : scope[key1];
            };
        }
        function getterFn(path, options, fullExp) {
            if (getterFnCache.hasOwnProperty(path)) {
                return getterFnCache[path];
            }
            var pathKeys = path.split("."), pathKeysLength = pathKeys.length, fn;
            if (!options.unwrapPromises && pathKeysLength === 1) {
                fn = simpleGetterFn1(pathKeys[0], fullExp);
            } else if (!options.unwrapPromises && pathKeysLength === 2) {
                fn = simpleGetterFn2(pathKeys[0], pathKeys[1], fullExp);
            } else if (options.csp) {
                if (pathKeysLength < 6) {
                    fn = cspSafeGetterFn(pathKeys[0], pathKeys[1], pathKeys[2], pathKeys[3], pathKeys[4], fullExp, options);
                } else {
                    fn = function(scope, locals) {
                        var i = 0, val;
                        do {
                            val = cspSafeGetterFn(pathKeys[i++], pathKeys[i++], pathKeys[i++], pathKeys[i++], pathKeys[i++], fullExp, options)(scope, locals);
                            locals = undefined;
                            scope = val;
                        } while (i < pathKeysLength);
                        return val;
                    };
                }
            } else {
                var code = "var p;\n";
                forEach(pathKeys, function(key, index) {
                    ensureSafeMemberName(key, fullExp);
                    code += "if(s == null) return undefined;\n" + "s=" + (index ? "s" : '((k&&k.hasOwnProperty("' + key + '"))?k:s)') + '["' + key + '"]' + ";\n" + (options.unwrapPromises ? "if (s && s.then) {\n" + ' pw("' + fullExp.replace(/(["\r\n])/g, "\\$1") + '");\n' + ' if (!("$$v" in s)) {\n' + " p=s;\n" + " p.$$v = undefined;\n" + " p.then(function(v) {p.$$v=v;});\n" + "}\n" + " s=s.$$v\n" + "}\n" : "");
                });
                code += "return s;";
                var evaledFnGetter = new Function("s", "k", "pw", code);
                evaledFnGetter.toString = valueFn(code);
                fn = options.unwrapPromises ? function(scope, locals) {
                    return evaledFnGetter(scope, locals, promiseWarning);
                } : evaledFnGetter;
            }
            if (path !== "hasOwnProperty") {
                getterFnCache[path] = fn;
            }
            return fn;
        }
        "use strict";
        var OPERATORS = {
            "null": function() {
                return null;
            },
            "true": function() {
                return true;
            },
            "false": function() {
                return false;
            },
            undefined: noop,
            "+": function(self, locals, a, b) {
                a = a(self, locals);
                b = b(self, locals);
                if (isDefined(a)) {
                    if (isDefined(b)) {
                        return a + b;
                    }
                    return a;
                }
                return isDefined(b) ? b : undefined;
            },
            "-": function(self, locals, a, b) {
                a = a(self, locals);
                b = b(self, locals);
                return (isDefined(a) ? a : 0) - (isDefined(b) ? b : 0);
            },
            "*": function(self, locals, a, b) {
                return a(self, locals) * b(self, locals);
            },
            "/": function(self, locals, a, b) {
                return a(self, locals) / b(self, locals);
            },
            "%": function(self, locals, a, b) {
                return a(self, locals) % b(self, locals);
            },
            "^": function(self, locals, a, b) {
                return a(self, locals) ^ b(self, locals);
            },
            "=": noop,
            "===": function(self, locals, a, b) {
                return a(self, locals) === b(self, locals);
            },
            "!==": function(self, locals, a, b) {
                return a(self, locals) !== b(self, locals);
            },
            "==": function(self, locals, a, b) {
                return a(self, locals) == b(self, locals);
            },
            "!=": function(self, locals, a, b) {
                return a(self, locals) != b(self, locals);
            },
            "<": function(self, locals, a, b) {
                return a(self, locals) < b(self, locals);
            },
            ">": function(self, locals, a, b) {
                return a(self, locals) > b(self, locals);
            },
            "<=": function(self, locals, a, b) {
                return a(self, locals) <= b(self, locals);
            },
            ">=": function(self, locals, a, b) {
                return a(self, locals) >= b(self, locals);
            },
            "&&": function(self, locals, a, b) {
                return a(self, locals) && b(self, locals);
            },
            "||": function(self, locals, a, b) {
                return a(self, locals) || b(self, locals);
            },
            "&": function(self, locals, a, b) {
                return a(self, locals) & b(self, locals);
            },
            "|": function(self, locals, a, b) {
                return b(self, locals)(self, locals, a(self, locals));
            },
            "!": function(self, locals, a) {
                return !a(self, locals);
            }
        };
        function ensureSafeMemberName(name, fullExpression) {
            if (name === "constructor") {
                throw $parseMinErr("isecfld", 'Referencing "constructor" field in Angular expressions is disallowed! Expression: {0}', fullExpression);
            }
            return name;
        }
        function ensureSafeObject(obj, fullExpression) {
            if (obj) {
                if (obj.constructor === obj) {
                    throw $parseMinErr("isecfn", "Referencing Function in Angular expressions is disallowed! Expression: {0}", fullExpression);
                } else if (obj.document && obj.location && obj.alert && obj.setInterval) {
                    throw $parseMinErr("isecwindow", "Referencing the Window in Angular expressions is disallowed! Expression: {0}", fullExpression);
                } else if (obj.children && (obj.nodeName || obj.prop && obj.attr && obj.find)) {
                    throw $parseMinErr("isecdom", "Referencing DOM nodes in Angular expressions is disallowed! Expression: {0}", fullExpression);
                }
            }
            return obj;
        }
        var ESCAPE = {
            n: "\n",
            f: "\f",
            r: "\r",
            t: "	",
            v: "",
            "'": "'",
            '"': '"'
        };
        function valueFn(value) {
            return function() {
                return value;
            };
        }
        var promiseWarning = function promiseWarningFn(fullExp) {
            if (!$parseOptions.logPromiseWarnings || promiseWarningCache.hasOwnProperty(fullExp)) return;
            promiseWarningCache[fullExp] = true;
            $log.warn("[$parse] Promise found in the expression `" + fullExp + "`. " + "Automatic unwrapping of promises in Angular expressions is deprecated.");
        };
        function noop() {}
        function isDefined(value) {
            return typeof value !== "undefined";
        }
        function toJsonReplacer(key, value) {
            var val = value;
            if (typeof key === "string" && key.charAt(0) === "$") {
                val = undefined;
            } else if (isWindow(value)) {
                val = "$WINDOW";
            } else if (value && document === value) {
                val = "$DOCUMENT";
            } else if (isScope(value)) {
                val = "$SCOPE";
            }
            return val;
        }
        function isWindow(obj) {
            return obj && obj.document && obj.location && obj.alert && obj.setInterval;
        }
        function isScope(obj) {
            return obj && obj.$evalAsync && obj.$watch;
        }
        function toJson(obj, pretty) {
            if (typeof obj === "undefined") return undefined;
            return JSON.stringify(obj, toJsonReplacer, pretty ? "  " : null);
        }
        var $parseMinErr = minErr("$parse");
        function minErr(module) {
            return function() {
                var code = arguments[0], prefix = "[" + (module ? module + ":" : "") + code + "] ", template = arguments[1], templateArgs = arguments, stringify = function(obj) {
                    if (typeof obj === "function") {
                        return obj.toString().replace(/ \{[\s\S]*$/, "");
                    } else if (typeof obj === "undefined") {
                        return "undefined";
                    } else if (typeof obj !== "string") {
                        return JSON.stringify(obj);
                    }
                    return obj;
                }, message, i;
                message = prefix + template.replace(/\{\d+\}/g, function(match) {
                    var index = +match.slice(1, -1), arg;
                    if (index + 2 < templateArgs.length) {
                        arg = templateArgs[index + 2];
                        if (typeof arg === "function") {
                            return arg.toString().replace(/ ?\{[\s\S]*$/, "");
                        } else if (typeof arg === "undefined") {
                            return "undefined";
                        } else if (typeof arg !== "string") {
                            return toJson(arg);
                        }
                        return arg;
                    }
                    return match;
                });
                message = message + "\nhttp://errors.angularjs.org/1.3.0-beta.8/" + (module ? module + "/" : "") + code;
                for (i = 2; i < arguments.length; i++) {
                    message = message + (i == 2 ? "?" : "&") + "p" + (i - 2) + "=" + encodeURIComponent(stringify(arguments[i]));
                }
                return new Error(message);
            };
        }
        var lowercase = function(string) {
            return isString(string) ? string.toLowerCase() : string;
        };
        function isString(value) {
            return typeof value === "string";
        }
        function toArray(obj) {
            var result = [], i = 0, len = obj.length;
            if (obj.length !== undefined) {
                while (i < len) {
                    result.push(obj[i]);
                    i += 1;
                }
            } else {
                for (i in obj) {
                    if (obj.hasOwnProperty(i)) {
                        result.push(obj[i]);
                    }
                }
            }
            return result;
        }
        function forEach(list, method, data) {
            var i = 0, len, result, extraArgs;
            if (arguments.length > 2) {
                extraArgs = toArray(arguments);
                extraArgs.splice(0, 2);
            }
            if (list && list.length) {
                len = list.length;
                while (i < len) {
                    result = method.apply(null, [ list[i], i, list ].concat(extraArgs));
                    if (result !== undefined) {
                        return result;
                    }
                    i += 1;
                }
            } else if (!(list instanceof Array)) {
                for (i in list) {
                    if (list.hasOwnProperty(i)) {
                        result = method.apply(null, [ list[i], i, list ].concat(extraArgs));
                        if (result !== undefined) {
                            return result;
                        }
                    }
                }
            }
            return list;
        }
        function setHashKey(obj, h) {
            if (h) {
                obj.$$hashKey = h;
            } else {
                delete obj.$$hashKey;
            }
        }
        function extend(dst) {
            var h = dst.$$hashKey;
            forEach(arguments, function(obj) {
                if (obj !== dst) {
                    forEach(obj, function(value, key) {
                        dst[key] = value;
                    });
                }
            });
            setHashKey(dst, h);
            return dst;
        }
        var Lexer = function(options) {
            this.options = options;
        };
        Lexer.prototype = {
            constructor: Lexer,
            lex: function(text) {
                this.text = text;
                this.index = 0;
                this.ch = undefined;
                this.lastCh = ":";
                this.tokens = [];
                var token;
                var json = [];
                while (this.index < this.text.length) {
                    this.ch = this.text.charAt(this.index);
                    if (this.is("\"'")) {
                        this.readString(this.ch);
                    } else if (this.isNumber(this.ch) || this.is(".") && this.isNumber(this.peek())) {
                        this.readNumber();
                    } else if (this.isIdent(this.ch)) {
                        this.readIdent();
                        if (this.was("{,") && json[0] === "{" && (token = this.tokens[this.tokens.length - 1])) {
                            token.json = token.text.indexOf(".") === -1;
                        }
                    } else if (this.is("(){}[].,;:?")) {
                        this.tokens.push({
                            index: this.index,
                            text: this.ch,
                            json: this.was(":[,") && this.is("{[") || this.is("}]:,")
                        });
                        if (this.is("{[")) json.unshift(this.ch);
                        if (this.is("}]")) json.shift();
                        this.index++;
                    } else if (this.isWhitespace(this.ch)) {
                        this.index++;
                        continue;
                    } else {
                        var ch2 = this.ch + this.peek();
                        var ch3 = ch2 + this.peek(2);
                        var fn = OPERATORS[this.ch];
                        var fn2 = OPERATORS[ch2];
                        var fn3 = OPERATORS[ch3];
                        if (fn3) {
                            this.tokens.push({
                                index: this.index,
                                text: ch3,
                                fn: fn3
                            });
                            this.index += 3;
                        } else if (fn2) {
                            this.tokens.push({
                                index: this.index,
                                text: ch2,
                                fn: fn2
                            });
                            this.index += 2;
                        } else if (fn) {
                            this.tokens.push({
                                index: this.index,
                                text: this.ch,
                                fn: fn,
                                json: this.was("[,:") && this.is("+-")
                            });
                            this.index += 1;
                        } else {
                            this.throwError("Unexpected next character ", this.index, this.index + 1);
                        }
                    }
                    this.lastCh = this.ch;
                }
                return this.tokens;
            },
            is: function(chars) {
                return chars.indexOf(this.ch) !== -1;
            },
            was: function(chars) {
                return chars.indexOf(this.lastCh) !== -1;
            },
            peek: function(i) {
                var num = i || 1;
                return this.index + num < this.text.length ? this.text.charAt(this.index + num) : false;
            },
            isNumber: function(ch) {
                return "0" <= ch && ch <= "9";
            },
            isWhitespace: function(ch) {
                return ch === " " || ch === "\r" || ch === "	" || ch === "\n" || ch === "" || ch === " ";
            },
            isIdent: function(ch) {
                return "a" <= ch && ch <= "z" || "A" <= ch && ch <= "Z" || "_" === ch || ch === "$";
            },
            isExpOperator: function(ch) {
                return ch === "-" || ch === "+" || this.isNumber(ch);
            },
            throwError: function(error, start, end) {
                end = end || this.index;
                var colStr = isDefined(start) ? "s " + start + "-" + this.index + " [" + this.text.substring(start, end) + "]" : " " + end;
                throw $parseMinErr("lexerr", "Lexer Error: {0} at column{1} in expression [{2}].", error, colStr, this.text);
            },
            readNumber: function() {
                var number = "";
                var start = this.index;
                while (this.index < this.text.length) {
                    var ch = lowercase(this.text.charAt(this.index));
                    if (ch == "." || this.isNumber(ch)) {
                        number += ch;
                    } else {
                        var peekCh = this.peek();
                        if (ch == "e" && this.isExpOperator(peekCh)) {
                            number += ch;
                        } else if (this.isExpOperator(ch) && peekCh && this.isNumber(peekCh) && number.charAt(number.length - 1) == "e") {
                            number += ch;
                        } else if (this.isExpOperator(ch) && (!peekCh || !this.isNumber(peekCh)) && number.charAt(number.length - 1) == "e") {
                            this.throwError("Invalid exponent");
                        } else {
                            break;
                        }
                    }
                    this.index++;
                }
                number = 1 * number;
                this.tokens.push({
                    index: start,
                    text: number,
                    json: true,
                    fn: function() {
                        return number;
                    }
                });
            },
            readIdent: function() {
                var parser = this;
                var ident = "";
                var start = this.index;
                var lastDot, peekIndex, methodName, ch;
                while (this.index < this.text.length) {
                    ch = this.text.charAt(this.index);
                    if (ch === "." || this.isIdent(ch) || this.isNumber(ch)) {
                        if (ch === ".") lastDot = this.index;
                        ident += ch;
                    } else {
                        break;
                    }
                    this.index++;
                }
                if (lastDot) {
                    peekIndex = this.index;
                    while (peekIndex < this.text.length) {
                        ch = this.text.charAt(peekIndex);
                        if (ch === "(") {
                            methodName = ident.substr(lastDot - start + 1);
                            ident = ident.substr(0, lastDot - start);
                            this.index = peekIndex;
                            break;
                        }
                        if (this.isWhitespace(ch)) {
                            peekIndex++;
                        } else {
                            break;
                        }
                    }
                }
                var token = {
                    index: start,
                    text: ident
                };
                if (OPERATORS.hasOwnProperty(ident)) {
                    token.fn = OPERATORS[ident];
                    token.json = OPERATORS[ident];
                } else {
                    var getter = getterFn(ident, this.options, this.text);
                    token.fn = extend(function(self, locals) {
                        return getter(self, locals);
                    }, {
                        assign: function(self, value) {
                            return setter(self, ident, value, parser.text, parser.options);
                        }
                    });
                }
                this.tokens.push(token);
                if (methodName) {
                    this.tokens.push({
                        index: lastDot,
                        text: ".",
                        json: false
                    });
                    this.tokens.push({
                        index: lastDot + 1,
                        text: methodName,
                        json: false
                    });
                }
            },
            readString: function(quote) {
                var start = this.index;
                this.index++;
                var string = "";
                var rawString = quote;
                var escape = false;
                while (this.index < this.text.length) {
                    var ch = this.text.charAt(this.index);
                    rawString += ch;
                    if (escape) {
                        if (ch === "u") {
                            var hex = this.text.substring(this.index + 1, this.index + 5);
                            if (!hex.match(/[\da-f]{4}/i)) this.throwError("Invalid unicode escape [\\u" + hex + "]");
                            this.index += 4;
                            string += String.fromCharCode(parseInt(hex, 16));
                        } else {
                            var rep = ESCAPE[ch];
                            if (rep) {
                                string += rep;
                            } else {
                                string += ch;
                            }
                        }
                        escape = false;
                    } else if (ch === "\\") {
                        escape = true;
                    } else if (ch === quote) {
                        this.index++;
                        this.tokens.push({
                            index: start,
                            text: rawString,
                            string: string,
                            json: true,
                            fn: function() {
                                return string;
                            }
                        });
                        return;
                    } else {
                        string += ch;
                    }
                    this.index++;
                }
                this.throwError("Unterminated quote", start);
            }
        };
        var Parser = function(lexer, $filter, options) {
            this.lexer = lexer;
            this.$filter = $filter;
            this.options = options;
        };
        Parser.ZERO = extend(function() {
            return 0;
        }, {
            constant: true
        });
        Parser.prototype = {
            constructor: Parser,
            parse: function(text, json) {
                this.text = text;
                this.json = json;
                this.tokens = this.lexer.lex(text);
                if (json) {
                    this.assignment = this.logicalOR;
                    this.functionCall = this.fieldAccess = this.objectIndex = this.filterChain = function() {
                        this.throwError("is not valid json", {
                            text: text,
                            index: 0
                        });
                    };
                }
                var value = json ? this.primary() : this.statements();
                if (this.tokens.length !== 0) {
                    this.throwError("is an unexpected token", this.tokens[0]);
                }
                value.literal = !!value.literal;
                value.constant = !!value.constant;
                return value;
            },
            primary: function() {
                var primary;
                if (this.expect("(")) {
                    primary = this.filterChain();
                    this.consume(")");
                } else if (this.expect("[")) {
                    primary = this.arrayDeclaration();
                } else if (this.expect("{")) {
                    primary = this.object();
                } else {
                    var token = this.expect();
                    primary = token.fn;
                    if (!primary) {
                        this.throwError("not a primary expression", token);
                    }
                    if (token.json) {
                        primary.constant = true;
                        primary.literal = true;
                    }
                }
                var next, context;
                while (next = this.expect("(", "[", ".")) {
                    if (next.text === "(") {
                        primary = this.functionCall(primary, context);
                        context = null;
                    } else if (next.text === "[") {
                        context = primary;
                        primary = this.objectIndex(primary);
                    } else if (next.text === ".") {
                        context = primary;
                        primary = this.fieldAccess(primary);
                    } else {
                        this.throwError("IMPOSSIBLE");
                    }
                }
                return primary;
            },
            throwError: function(msg, token) {
                throw $parseMinErr("syntax", "Syntax Error: Token '{0}' {1} at column {2} of the expression [{3}] starting at [{4}].", token.text, msg, token.index + 1, this.text, this.text.substring(token.index));
            },
            peekToken: function() {
                if (this.tokens.length === 0) throw $parseMinErr("ueoe", "Unexpected end of expression: {0}", this.text);
                return this.tokens[0];
            },
            peek: function(e1, e2, e3, e4) {
                if (this.tokens.length > 0) {
                    var token = this.tokens[0];
                    var t = token.text;
                    if (t === e1 || t === e2 || t === e3 || t === e4 || !e1 && !e2 && !e3 && !e4) {
                        return token;
                    }
                }
                return false;
            },
            expect: function(e1, e2, e3, e4) {
                var token = this.peek(e1, e2, e3, e4);
                if (token) {
                    if (this.json && !token.json) {
                        this.throwError("is not valid json", token);
                    }
                    this.tokens.shift();
                    return token;
                }
                return false;
            },
            consume: function(e1) {
                if (!this.expect(e1)) {
                    this.throwError("is unexpected, expecting [" + e1 + "]", this.peek());
                }
            },
            unaryFn: function(fn, right) {
                return extend(function(self, locals) {
                    return fn(self, locals, right);
                }, {
                    constant: right.constant
                });
            },
            ternaryFn: function(left, middle, right) {
                return extend(function(self, locals) {
                    return left(self, locals) ? middle(self, locals) : right(self, locals);
                }, {
                    constant: left.constant && middle.constant && right.constant
                });
            },
            binaryFn: function(left, fn, right) {
                return extend(function(self, locals) {
                    return fn(self, locals, left, right);
                }, {
                    constant: left.constant && right.constant
                });
            },
            statements: function() {
                var statements = [];
                while (true) {
                    if (this.tokens.length > 0 && !this.peek("}", ")", ";", "]")) statements.push(this.filterChain());
                    if (!this.expect(";")) {
                        return statements.length === 1 ? statements[0] : function(self, locals) {
                            var value;
                            for (var i = 0; i < statements.length; i++) {
                                var statement = statements[i];
                                if (statement) {
                                    value = statement(self, locals);
                                }
                            }
                            return value;
                        };
                    }
                }
            },
            filterChain: function() {
                var left = this.expression();
                var token;
                while (true) {
                    if (token = this.expect("|")) {
                        left = this.binaryFn(left, token.fn, this.filter());
                    } else {
                        return left;
                    }
                }
            },
            filter: function() {
                var token = this.expect();
                var fn = this.$filter(token.text);
                var argsFn = [];
                while (true) {
                    if (token = this.expect(":")) {
                        argsFn.push(this.expression());
                    } else {
                        var fnInvoke = function(self, locals, input) {
                            var args = [ input ];
                            for (var i = 0; i < argsFn.length; i++) {
                                args.push(argsFn[i](self, locals));
                            }
                            return fn.apply(self, args);
                        };
                        return function() {
                            return fnInvoke;
                        };
                    }
                }
            },
            expression: function() {
                return this.assignment();
            },
            assignment: function() {
                var left = this.ternary();
                var right;
                var token;
                if (token = this.expect("=")) {
                    if (!left.assign) {
                        this.throwError("implies assignment but [" + this.text.substring(0, token.index) + "] can not be assigned to", token);
                    }
                    right = this.ternary();
                    return function(scope, locals) {
                        return left.assign(scope, right(scope, locals), locals);
                    };
                }
                return left;
            },
            ternary: function() {
                var left = this.logicalOR();
                var middle;
                var token;
                if (token = this.expect("?")) {
                    middle = this.ternary();
                    if (token = this.expect(":")) {
                        return this.ternaryFn(left, middle, this.ternary());
                    } else {
                        this.throwError("expected :", token);
                    }
                } else {
                    return left;
                }
            },
            logicalOR: function() {
                var left = this.logicalAND();
                var token;
                while (true) {
                    if (token = this.expect("||")) {
                        left = this.binaryFn(left, token.fn, this.logicalAND());
                    } else {
                        return left;
                    }
                }
            },
            logicalAND: function() {
                var left = this.equality();
                var token;
                if (token = this.expect("&&")) {
                    left = this.binaryFn(left, token.fn, this.logicalAND());
                }
                return left;
            },
            equality: function() {
                var left = this.relational();
                var token;
                if (token = this.expect("==", "!=", "===", "!==")) {
                    left = this.binaryFn(left, token.fn, this.equality());
                }
                return left;
            },
            relational: function() {
                var left = this.additive();
                var token;
                if (token = this.expect("<", ">", "<=", ">=")) {
                    left = this.binaryFn(left, token.fn, this.relational());
                }
                return left;
            },
            additive: function() {
                var left = this.multiplicative();
                var token;
                while (token = this.expect("+", "-")) {
                    left = this.binaryFn(left, token.fn, this.multiplicative());
                }
                return left;
            },
            multiplicative: function() {
                var left = this.unary();
                var token;
                while (token = this.expect("*", "/", "%")) {
                    left = this.binaryFn(left, token.fn, this.unary());
                }
                return left;
            },
            unary: function() {
                var token;
                if (this.expect("+")) {
                    return this.primary();
                } else if (token = this.expect("-")) {
                    return this.binaryFn(Parser.ZERO, token.fn, this.unary());
                } else if (token = this.expect("!")) {
                    return this.unaryFn(token.fn, this.unary());
                } else {
                    return this.primary();
                }
            },
            fieldAccess: function(object) {
                var parser = this;
                var field = this.expect().text;
                var getter = getterFn(field, this.options, this.text);
                return extend(function(scope, locals, self) {
                    return getter(self || object(scope, locals));
                }, {
                    assign: function(scope, value, locals) {
                        return setter(object(scope, locals), field, value, parser.text, parser.options);
                    }
                });
            },
            objectIndex: function(obj) {
                var parser = this;
                var indexFn = this.expression();
                this.consume("]");
                return extend(function(self, locals) {
                    var o = obj(self, locals), i = indexFn(self, locals), v, p;
                    if (!o) return undefined;
                    v = ensureSafeObject(o[i], parser.text);
                    if (v && v.then && parser.options.unwrapPromises) {
                        p = v;
                        if (!("$$v" in v)) {
                            p.$$v = undefined;
                            p.then(function(val) {
                                p.$$v = val;
                            });
                        }
                        v = v.$$v;
                    }
                    return v;
                }, {
                    assign: function(self, value, locals) {
                        var key = indexFn(self, locals);
                        var safe = ensureSafeObject(obj(self, locals), parser.text);
                        return safe[key] = value;
                    }
                });
            },
            functionCall: function(fn, contextGetter) {
                var argsFn = [];
                if (this.peekToken().text !== ")") {
                    do {
                        argsFn.push(this.expression());
                    } while (this.expect(","));
                }
                this.consume(")");
                var parser = this;
                return function(scope, locals) {
                    var args = [];
                    var context = contextGetter ? contextGetter(scope, locals) : scope;
                    for (var i = 0; i < argsFn.length; i++) {
                        args.push(argsFn[i](scope, locals));
                    }
                    var fnPtr = fn(scope, locals, context) || noop;
                    ensureSafeObject(context, parser.text);
                    ensureSafeObject(fnPtr, parser.text);
                    var v = fnPtr.apply ? fnPtr.apply(context, args) : fnPtr(args[0], args[1], args[2], args[3], args[4]);
                    return ensureSafeObject(v, parser.text);
                };
            },
            arrayDeclaration: function() {
                var elementFns = [];
                var allConstant = true;
                if (this.peekToken().text !== "]") {
                    do {
                        if (this.peek("]")) {
                            break;
                        }
                        var elementFn = this.expression();
                        elementFns.push(elementFn);
                        if (!elementFn.constant) {
                            allConstant = false;
                        }
                    } while (this.expect(","));
                }
                this.consume("]");
                return extend(function(self, locals) {
                    var array = [];
                    for (var i = 0; i < elementFns.length; i++) {
                        array.push(elementFns[i](self, locals));
                    }
                    return array;
                }, {
                    literal: true,
                    constant: allConstant
                });
            },
            object: function() {
                var keyValues = [];
                var allConstant = true;
                if (this.peekToken().text !== "}") {
                    do {
                        if (this.peek("}")) {
                            break;
                        }
                        var token = this.expect(), key = token.string || token.text;
                        this.consume(":");
                        var value = this.expression();
                        keyValues.push({
                            key: key,
                            value: value
                        });
                        if (!value.constant) {
                            allConstant = false;
                        }
                    } while (this.expect(","));
                }
                this.consume("}");
                return extend(function(self, locals) {
                    var object = {};
                    for (var i = 0; i < keyValues.length; i++) {
                        var keyValue = keyValues[i];
                        object[keyValue.key] = keyValue.value(self, locals);
                    }
                    return object;
                }, {
                    literal: true,
                    constant: allConstant
                });
            }
        };
        var lexer = new Lexer({}), $filter = {}, parser = new Parser(lexer, $filter, {
            unwrapPromises: true
        });
        return parser.parse.bind(parser);
    }();
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
    query.fn.addClass = function(className) {
        var scope = this;
        this.each(function(index, el) {
            if (!scope.hasClass(el, className)) {
                el.className += " " + className;
            }
        });
        return this;
    };
    query.fn.hasClass = function(el, className) {
        if (el.classList) {
            return el.classList.contains(className);
        }
        return new RegExp("(^| )" + className + "( |$)", "gi").test(el.className);
    };
    query.fn.removeClass = function(className) {
        var scope = this;
        this.each(function(index, el) {
            if (validators.isDefined(className)) {
                var newClass = " " + el.className.replace(/[\t\r\n]/g, " ") + " ";
                if (scope.hasClass(el, className)) {
                    while (newClass.indexOf(" " + className + " ") >= 0) {
                        newClass = newClass.replace(" " + className + " ", " ");
                    }
                    el.className = newClass.replace(/^\s+|\s+$/g, "");
                }
            } else {
                el.className = "";
            }
        });
        return this;
    };
    query.fn.css = function(prop, value) {
        var el, returnValue;
        if (this.length) {
            el = this[0];
            if (arguments.length > 1) {
                this.each(function(index, el) {
                    el.style[prop] = value;
                });
            }
            if (prop instanceof Array) {
                var i = 0, len = prop.length;
                returnValue = {};
                if (el.currentStyle) {
                    while (i < len) {
                        returnValue[prop[i]] = el.currentStyle[prop[i]];
                        i += 1;
                    }
                } else if (window.getComputedStyle) {
                    while (i < len) {
                        returnValue[prop[i]] = document.defaultView.getComputedStyle(el, null).getPropertyValue(prop[i]);
                        i += 1;
                    }
                }
            } else {
                if (el.currentStyle) {
                    returnValue = el.currentStyle[prop];
                } else if (window.getComputedStyle) {
                    returnValue = document.defaultView.getComputedStyle(el, null).getPropertyValue(prop);
                }
            }
            return returnValue;
        }
        return null;
    };
    var validators = {};
    validators.isDefined = function(val) {
        return typeof val !== "undefined";
    };
    ready();
    exports["ready"] = ready;
    exports["ajax"] = ajax;
    exports["app"] = app;
    exports["browser"] = browser;
    exports["formatters"] = formatters;
    exports["helpers"] = helpers;
    exports["parsers"] = parsers;
    exports["query"] = query;
    exports["validators"] = validators;
})({}, function() {
    return this;
}());