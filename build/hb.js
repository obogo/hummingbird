(function(exports, global) {
    global["hb"] = exports;
    var $$cache = exports.$$cache || {};
    var $$internals = exports.$$internals || {};
    var $$pending = exports.$$pending || {};
    var define = function(name) {
        var args = Array.prototype.slice.call(arguments);
        if (typeof args[1] === "function") {
            exports[name] = args[1]();
        } else {
            $$cache[name] = args[2];
            $$cache[name].$inject = args[1];
            $$cache[name].$internal = false;
        }
    };
    var internal = function(name) {
        var args = Array.prototype.slice.call(arguments);
        if (typeof args[1] === "function") {
            $$internals[name] = args[1]();
        } else {
            $$cache[name] = args[2];
            $$cache[name].$inject = args[1];
            $$cache[name].$internal = true;
        }
    };
    var resolve = function(name, fn) {
        $$pending[name] = true;
        var injections = fn.$inject;
        var args = [];
        var injectionName;
        for (var i in injections) {
            injectionName = injections[i];
            if ($$cache[injectionName]) {
                if ($$pending.hasOwnProperty(injectionName)) {
                    throw new Error('Cyclical reference: "' + name + '" referencing "' + injectionName + '"');
                }
                resolve(injectionName, $$cache[injectionName]);
                delete $$cache[injectionName];
            }
        }
        if (!exports[name] && !$$internals[name]) {
            for (var n in injections) {
                injectionName = injections[n];
                args.push(exports[injectionName] || $$internals[injectionName]);
            }
            if (fn.$internal) {
                $$internals[name] = fn.apply(null, args) || name;
            } else {
                exports[name] = fn.apply(null, args) || name;
            }
        }
        exports.$$cache = $$cache;
        exports.$$internals = $$internals;
        exports.$$pending = $$pending;
        delete $$pending[name];
    };
    //! src/utils/data/resolve.js
    define("resolve", function() {
        function Resolve(data) {
            this.data = data || {};
        }
        var proto = Resolve.prototype;
        proto.get = function(path, delimiter) {
            var arr = path.split(delimiter || "."), space = "", i = 0, len = arr.length;
            var data = this.data;
            while (i < len) {
                space = arr[i];
                data = data[space];
                if (data === undefined) {
                    break;
                }
                i += 1;
            }
            return data;
        };
        proto.set = function(path, value, delimiter) {
            var arr = path.split(delimiter || "."), space = "", i = 0, len = arr.length - 1;
            var data = this.data;
            while (i < len) {
                space = arr[i];
                if (data[space] === undefined) {
                    data = data[space] = {};
                } else {
                    data = data[space];
                }
                i += 1;
            }
            if (arr.length > 1) {
                data[arr.pop()] = value;
            }
            return this.data;
        };
        proto.path = function(path) {
            return this.set(path, {});
        };
        var resolve = function(data) {
            return new Resolve(data);
        };
        return resolve;
    });
    //! src/framework/module.js
    /*!
 import directives.app
 import directives.model
 import directives.events
 errors.build
 */
    define("module", [ "injector", "interpolator", "framework", "framework.compiler", "framework.scope", "removeHTMLComments", "each" ], function(injector, interpolator, framework, compiler, scope, removeHTMLComments, each) {
        var modules = {};
        function Module(name) {
            var self = this;
            self.name = name;
            var rootEl;
            var rootScope = scope();
            var bootstraps = [];
            var _injector = this.injector = injector();
            var _interpolator = this.interpolator = interpolator(_injector);
            var _compiler = compiler(self);
            var compile = _compiler.compile;
            var interpolate = _interpolator.exec;
            var val = _injector.val.bind(_injector);
            _injector.preProcessor = function(key, value) {
                if (value && value.isClass) {
                    return _injector.instantiate(value);
                }
            };
            val("$rootScope", rootScope);
            rootScope.interpolate = function(scope, exp, data) {
                if (typeof exp === "function") {
                    return exp(scope, data);
                }
                return interpolate(scope, exp);
            };
            function findScope(el) {
                if (!el) {
                    return null;
                }
                if (el.scope) {
                    return el.scope;
                }
                return findScope(el.parentNode);
            }
            function bootstrap(el) {
                if (el) {
                    self.element(el);
                    if (self.preInit) {
                        self.preInit();
                    }
                    while (bootstraps.length) {
                        _injector.invoke(bootstraps.shift(), self);
                    }
                    rootScope.$broadcast("module::ready", self);
                    rootScope.$apply();
                }
            }
            function addChild(parentEl, htmlStr, overrideScope, data) {
                if (!htmlStr) {
                    return;
                }
                if (parentEl !== rootEl && rootEl.contains && !rootEl.contains(parentEl)) {
                    throw new Error("parent element not found in %o", rootEl);
                }
                parentEl.insertAdjacentHTML("beforeend", removeHTMLComments(htmlStr));
                var scope = overrideScope || findScope(parentEl);
                var child = parentEl.children[parentEl.children.length - 1];
                return compileEl(child, overrideScope || scope, !!overrideScope, data);
            }
            function compileEl(el, scope, sameScope, data) {
                var s = sameScope && scope || scope.$new(), i;
                if (data) {
                    for (i in data) {
                        if (data.hasOwnProperty(i) && !s[i] !== undefined) {
                            s[i] = data[i];
                        }
                    }
                }
                _compiler.link(el, s);
                compile(el, scope);
                return el;
            }
            function removeChild(childEl) {
                var list;
                if (childEl.scope) {
                    childEl.scope.$destroy();
                    childEl.scope = null;
                } else {
                    list = childEl.querySelectorAll(name + "-id");
                    each(list, removeChild);
                }
                childEl.remove();
            }
            function element(el) {
                if (typeof el !== "undefined") {
                    rootEl = el;
                    _compiler.link(rootEl, rootScope);
                    compile(rootEl, rootScope);
                }
                return rootEl;
            }
            function service(name, ClassRef) {
                if (ClassRef === undefined) {
                    return val(name);
                }
                ClassRef.isClass = true;
                return val(name, ClassRef);
            }
            function init() {
                each(framework.directives, function(item) {
                    item(self);
                });
                each(framework.filters, function(item) {
                    item(self);
                });
            }
            self.bindingMarkup = [ "{{", "}}" ];
            self.elements = {};
            self.bootstrap = bootstrap;
            self.findScope = findScope;
            self.addChild = addChild;
            self.removeChild = removeChild;
            self.compile = compileEl;
            self.interpolate = interpolate;
            self.element = element;
            self.val = val;
            self.directive = val;
            self.filter = val;
            self.factory = val;
            self.service = service;
            self.template = val;
            setTimeout(init);
        }
        return function(name, forceNew) {
            if (!name) {
                throw exports.errors.MESSAGES.E8;
            }
            var module = modules[name] = !forceNew && modules[name] || new Module(name);
            if (!module.injector.val("module")) {
                module.injector.val("module", module);
                module.injector.val("$window", window);
            }
            return module;
        };
    });
    //! src/framework/framework.js
    internal("framework", function() {
        var framework = {
            debug: {},
            plugins: {},
            filters: {},
            errors: {},
            directives: {}
        };
        var ON_STR = "on";
        framework.on = function(el, eventName, handler) {
            if (el.attachEvent) {
                el.attachEvent(ON_STR + eventName, el[eventName + handler]);
            } else {
                el.addEventListener(eventName, handler, false);
            }
        };
        framework.off = function(el, eventName, handler) {
            if (el.detachEvent) {
                el.detachEvent(ON_STR + eventName, el[eventName + handler]);
            } else {
                el.removeEventListener(eventName, handler, false);
            }
        };
        return framework;
    });
    //! src/utils/browser/ready.js
    define("ready", function() {
        var callbacks = [], win = window, doc = document, ADD_EVENT_LISTENER = "addEventListener", REMOVE_EVENT_LISTENER = "removeEventListener", ATTACH_EVENT = "attachEvent", DETACH_EVENT = "detachEvent", DOM_CONTENT_LOADED = "DOMContentLoaded", ON_READY_STATE_CHANGE = "onreadystatechange", COMPLETE = "complete", READY_STATE = "readyState";
        var ready = function(callback) {
            callbacks.push(callback);
            if (doc[READY_STATE] === COMPLETE) {
                setTimeout(invokeCallbacks);
            }
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
        return ready;
    });
    //! src/framework/directives/model.js
    internal("directives.model", [ "framework", "resolve", "query" ], function(framework, resolve, query) {
        return framework.directives.model = function(module) {
            module.directive("hbModel", function() {
                var $ = query;
                return {
                    link: function(scope, el, alias) {
                        var $el = $(el);
                        scope.$watch(alias.value, function(newVal) {
                            el.value = newVal;
                        });
                        function eventHandler(evt) {
                            resolve(scope).set(alias.value, el.value);
                            var change = el.getAttribute("hb-change");
                            if (change) {
                                scope.$eval(change);
                            }
                            scope.$apply();
                        }
                        $el.bind("change keyup blur input onpropertychange", eventHandler);
                        scope.$on("$destroy", function() {
                            $el.unbindAll();
                        });
                    }
                };
            });
        };
    });
    //! src/utils/query/event/bind.js
    internal("query.bind", [ "query" ], function(query) {
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
    });
    //! src/utils/query/query.js
    define("query", function() {
        function Query(selector, context) {
            this.init(selector, context);
        }
        var queryPrototype = Query.prototype = Object.create(Array.prototype);
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
        var query = function(selector, context) {
            for (var n in query.fn) {
                if (query.fn.hasOwnProperty(n)) {
                    queryPrototype[n] = query.fn[n];
                    delete query.fn[n];
                }
            }
            return new Query(selector, context);
        };
        query.fn = {};
        return query;
    });
    //! src/utils/query/event/unbind.js
    internal("query.unbind", [ "query" ], function(query) {
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
                    i += 1;
                }
            }
            return this;
        };
    });
    //! src/utils/query/event/unbindAll.js
    internal("query.unbindAll", [ "query" ], function(query) {
        query.fn.unbindAll = function(event) {
            var scope = this;
            scope.each(function(index, el) {
                if (el.eventHolder) {
                    var removed = 0, handler;
                    for (var i = 0; i < el.eventHolder.length; i++) {
                        if (!event || el.eventHolder[i][0] === event) {
                            event = el.eventHolder[i][0];
                            handler = el.eventHolder[i][1];
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
            return scope;
        };
    });
    //! src/framework/directives/app.js
    internal("directives.app", [ "framework", "ready" ], function(framework, ready) {
        return framework.directives.app = function(module) {
            module.directive(module.name + "App", function() {
                return {
                    link: function(scope, el) {}
                };
            });
            ready(function() {
                var el = document.querySelector("[" + module.name + "-app]");
                if (el) {
                    module.bootstrap(el);
                }
            });
        };
    });
    //! src/framework/directives/events.js
    internal("directives.events", [ "framework", "each" ], function(framework, each) {
        var UI_EVENTS = "click mousedown mouseup keydown keyup touchstart touchend touchmove".split(" ");
        var pfx = [ "webkit", "moz", "MS", "o", "" ];
        var ANIME_EVENTS = "AnimationStart AnimationEnd".split(" ");
        function onAnime(element, eventType, callback) {
            for (var p = 0; p < pfx.length; p++) {
                if (!pfx[p]) {
                    eventType = eventType.toLowerCase();
                }
                element.addEventListener(pfx[p] + eventType, callback, false);
            }
        }
        return framework.directives.events = function(module) {
            each(ANIME_EVENTS, function(eventName) {
                module.val(eventName, function() {
                    return {
                        link: function(scope, el, alias) {
                            function handle(evt) {
                                if (evt.target.nodeName.toLowerCase() === "a") {
                                    evt.preventDefault();
                                }
                                scope.$event = evt;
                                if (evt.target === el) {
                                    module.interpolate(scope, alias.value);
                                    scope.$apply();
                                }
                                return false;
                            }
                            onAnime(el, eventName, handle);
                        }
                    };
                }, "event");
            });
            each(UI_EVENTS, function(eventName) {
                module.directive("hb" + eventName.charAt(0).toUpperCase() + eventName.substr(1), function() {
                    return {
                        link: function(scope, el, alias) {
                            function handle(evt) {
                                if (evt.target.nodeName.toLowerCase() === "a") {
                                    evt.preventDefault();
                                }
                                scope.$event = evt;
                                module.interpolate(scope, alias.value);
                                scope.$apply();
                                return false;
                            }
                            framework.on(el, eventName, handle);
                        }
                    };
                }, "event");
            });
        };
    });
    //! src/utils/array/each.js
    define("each", function() {
        function applyMethod(scope, method, item, index, list, extraArgs, all) {
            var args = all ? [ item, index, list ] : [ item ];
            return method.apply(scope, args.concat(extraArgs));
        }
        var each = function(list, method) {
            var i = 0, len, result, extraArgs;
            if (arguments.length > 2) {
                extraArgs = Array.prototype.slice.apply(arguments);
                extraArgs.splice(0, 2);
            }
            if (list && list.length && list.hasOwnProperty(0)) {
                len = list.length;
                while (i < len) {
                    result = applyMethod(this.scope, method, list[i], i, list, extraArgs, this.all);
                    if (result !== undefined) {
                        return result;
                    }
                    i += 1;
                }
            } else if (!(list instanceof Array) && list.length === undefined) {
                for (i in list) {
                    if (list.hasOwnProperty(i) && (!this.omit || !this.omit[i])) {
                        result = applyMethod(this.scope, method, list[i], i, list, extraArgs, this.all);
                        if (result !== undefined) {
                            return result;
                        }
                    }
                }
            }
            return list;
        };
        return each;
    });
    //! src/utils/patterns/injector.js
    define("injector", function() {
        var string = "string", func = "function", proto = Injector.prototype;
        function functionOrArray(fn) {
            var f;
            if (fn instanceof Array) {
                fn = fn.concat();
                f = fn.pop();
                f.$inject = fn;
                fn = f;
            }
            return fn;
        }
        function construct(constructor, args) {
            function F() {
                return constructor.apply(this, args);
            }
            F.prototype = constructor.prototype;
            return new F();
        }
        function getArgs(fn) {
            var str = fn.toString();
            return str.match(/\(.*\)/)[0].match(/([\$\w])+/gm);
        }
        function Injector() {
            this.registered = {};
            this.preProcessor = null;
        }
        proto.val = function(name, value) {
            var n = name.toLowerCase(), override;
            if (value !== undefined) {
                this.registered[n] = value;
            } else if (this.preProcessor) {
                override = this.preProcessor(name, this.registered[n]);
                if (override !== undefined) {
                    this.registered[n] = override;
                }
            }
            return this.registered[n];
        };
        proto.invoke = function(fn, scope, locals) {
            fn = functionOrArray(fn);
            return fn.apply(scope, this.prepareArgs(fn, locals, scope));
        };
        proto.instantiate = function(fn, locals) {
            fn = functionOrArray(fn);
            return construct(fn, this.prepareArgs(fn, locals));
        };
        proto.prepareArgs = function(fn, locals, scope) {
            if (!fn.$inject) {
                fn.$inject = getArgs(fn);
            }
            var args = fn.$inject ? fn.$inject.slice() : [], i, len = args.length;
            for (i = 0; i < len; i += 1) {
                this.getInjection(args[i], i, args, locals, scope);
            }
            return args;
        };
        proto.getArgs = getArgs;
        proto.getInjection = function(type, index, list, locals, scope) {
            var result, cacheValue;
            if (locals && locals[type]) {
                result = locals[type];
            } else if ((cacheValue = this.val(type)) !== undefined) {
                result = cacheValue;
            }
            if (result === undefined) {
                throw new Error("Injection not found for " + type);
            }
            if (result instanceof Array && typeof result[0] === string && typeof result[result.length - 1] === func) {
                result = this.invoke(result.concat(), scope);
            }
            list[index] = result;
        };
        return function() {
            return new Injector();
        };
    });
    //! src/utils/parsers/interpolator.js
    define("interpolator", [ "each", "removeLineBreaks", "removeExtraSpaces" ], function(each, removeLineBreaks, removeExtraSpaces) {
        function Interpolator(injector) {
            var self = this;
            var ths = "this";
            var errorHandler;
            function setErrorHandler(fn) {
                errorHandler = fn;
            }
            function interpolateError(er, scope, str, errorHandler) {
                if (errorHandler) {
                    errorHandler(er, 'Error evaluating: "' + str + '" against %o', scope);
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
                str = str.replace(/(\.?[a-zA-Z\$\_]+\w?\b)(?!\s?\:)/g, function(str, p1, offset, wholeString) {
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
                str = str.trim();
                var ary = [ ths ];
                while (scope && scope[str] === undefined) {
                    scope = scope.$parent;
                    ary.push("$parent");
                }
                if (scope && scope[str]) {
                    return ary.join(".") + "." + str;
                }
                return ths + "." + str;
            }
            function parseFilter(str, scope) {
                if (str.indexOf("|") !== -1 && str.match(/\w+\s?\|\s?\w+/)) {
                    str = str.replace("||", "~~");
                    var parts = str.trim().split("|");
                    parts[1] = parts[1].replace("~~", "||");
                    each.call({
                        all: true
                    }, parts, trimStrings);
                    parts[1] = parts[1].split(":");
                    var filterName = parts[1].shift(), filter = injector.val(filterName), args;
                    if (!filter) {
                        return parts[0];
                    } else {
                        args = parts[1];
                    }
                    each.call({
                        all: true
                    }, args, injector.getInjection, scope);
                    return {
                        filter: function(value) {
                            args.unshift(value);
                            return injector.invoke(filter, scope, {
                                alias: filterName
                            }).apply(scope, args);
                        },
                        str: parts[0]
                    };
                }
                return undefined;
            }
            function interpolate(scope, str, ignoreErrors) {
                var fn = Function, result, filter;
                str = removeLineBreaks(str);
                str = removeExtraSpaces(str);
                if (!str) {
                    return "";
                }
                filter = parseFilter(str, scope);
                if (filter) {
                    str = filter.str;
                }
                str = fixStrReferences(str, scope);
                if (!ignoreErrors) {
                    result = new fn("return " + str).apply(scope);
                } else {
                    result = new fn("var result; try { result = " + str + "; } catch(er) { result = er; } finally { return result; }").apply(scope);
                    if (result) {
                        if (typeof result === "object" && (result.hasOwnProperty("stack") || result.hasOwnProperty("stacktrace") || result.hasOwnProperty("backtrace"))) {
                            interpolateError(result, scope, str, errorHandler);
                        }
                    }
                }
                if (result === undefined || result === null || result + "" === "NaN") {
                    result = "";
                }
                return filter ? filter.filter(result) : result;
            }
            function trimStrings(str, index, list) {
                list[index] = str && str.trim();
            }
            self.exec = interpolate;
            self.setErrorHandler = setErrorHandler;
        }
        return function(injector) {
            return new Interpolator(injector);
        };
    });
    //! src/utils/formatters/removeLineBreaks.js
    define("removeLineBreaks", function() {
        var removeLineBreaks = function(str) {
            str = str + "";
            return str.replace(/(\r\n|\n|\r)/gm, "");
        };
        return removeLineBreaks;
    });
    //! src/utils/formatters/removeExtraSpaces.js
    define("removeExtraSpaces", function() {
        var removeExtraSpaces = function(str) {
            str = str + "";
            return str.replace(/\s+/g, " ");
        };
        return removeExtraSpaces;
    });
    //! src/framework/compiler.js
    internal("framework.compiler", [ "each" ], function(each) {
        function Compiler(module) {
            var ID = module.name + "-id";
            var injector = module.injector;
            var interpolator = module.interpolator;
            var self = this;
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
            function removeComments(el, parent) {
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
            function parseBinds(str, o) {
                if (str) {
                    var regExp = new RegExp(module.bindingMarkup[0] + "(.*?)" + module.bindingMarkup[1], "mg");
                    return str.replace(regExp, function(a, b) {
                        var r = interpolator.exec(o, b.trim(), true);
                        return typeof r === "string" || typeof r === "number" ? r : typeof r === "object" ? JSON.stringify(r) : "";
                    });
                }
                return str;
            }
            function invokeLink(directive, el) {
                var scope = module.findScope(el);
                injector.invoke(directive.options.link, scope, {
                    scope: scope,
                    el: el,
                    alias: directive.alias
                });
            }
            function link(el, scope) {
                if (el) {
                    el.setAttribute(ID, scope.$id);
                    module.elements[scope.$id] = el;
                    el.scope = scope;
                }
            }
            function findDirectives(el) {
                var attributes = el.attributes, attrs = [ {
                    name: el.nodeName.toLowerCase(),
                    value: ""
                } ], attr, returnVal = [], i, len = attributes.length, name, directiveFn;
                for (i = 0; i < len; i += 1) {
                    attr = attributes[i];
                    attrs.push({
                        name: attr.name,
                        value: el.getAttribute(attr.name)
                    });
                }
                len = attrs.length;
                for (i = 0; i < len; i += 1) {
                    attr = attrs[i];
                    name = attr ? attr.name.split("-").join("") : "";
                    directiveFn = injector.val(name);
                    if (directiveFn) {
                        returnVal.push({
                            options: injector.invoke(directiveFn),
                            alias: {
                                name: attr.name,
                                value: attr.value
                            }
                        });
                    }
                }
                return returnVal;
            }
            function createChildScope(parentScope, el, isolated, data) {
                var scope = parentScope.$new(isolated);
                link(el, scope);
                extend(scope, data);
                return scope;
            }
            function createWatchers(node, scope) {
                if (node.nodeType === 3) {
                    if (node.nodeValue.indexOf(module.bindingMarkup[0]) !== -1 && !hasNodeWatcher(scope, node)) {
                        var value = node.nodeValue;
                        scope.$watch(function() {
                            return parseBinds(value, scope);
                        }, function(newVal) {
                            node.nodeValue = newVal;
                        });
                        scope.$w[0].node = node;
                    }
                } else if (!node.getAttribute(ID) && node.childNodes.length) {
                    each(node.childNodes, createWatchers, scope);
                }
            }
            function hasNodeWatcher(scope, node) {
                var i = 0, len = scope.$w.length;
                while (i < len) {
                    if (scope.$w[i].node === node) {
                        return true;
                    }
                    i += 1;
                }
                return false;
            }
            function compile(el, scope) {
                if (!el.compiled) {
                    el.compiled = true;
                    each(el.childNodes, removeComments, el);
                    var directives = findDirectives(el), links = [];
                    if (directives && directives.length) {
                        each(directives, compileDirective, el, scope, links);
                        each(links, invokeLink, el);
                    }
                }
                if (el) {
                    scope = el.scope || scope;
                    var i = 0, len = el.children.length;
                    while (i < len) {
                        if (!el.children[i].compiled) {
                            compile(el.children[i], scope);
                        }
                        i += 1;
                    }
                    if (el.getAttribute(ID)) {
                        compileWatchers(el, scope);
                    }
                }
                return el;
            }
            function compileWatchers(el, scope) {
                each(el.childNodes, createWatchers, scope);
            }
            function compileDirective(directive, el, parentScope, links) {
                var options = directive.options, scope;
                if (!el.scope && options.scope) {
                    scope = createChildScope(parentScope, el, typeof directive.options.scope === "object", directive.options.scope);
                }
                if (options.tpl) {
                    el.innerHTML = typeof options.tpl === "string" ? options.tpl : injector.invoke(options.tpl, scope || el.scope, {
                        scope: scope || el.scope,
                        el: el,
                        alias: directive.alias
                    });
                }
                if (options.tplUrl) {
                    el.innerHTML = module.val(typeof options.tplUrl === "string" ? options.tplUrl : injector.invoke(options.tplUrl, scope || el.scope, {
                        scope: scope || el.scope,
                        el: el,
                        alias: directive.alias
                    }));
                }
                if (module.preLink) {
                    module.preLink(el, directive);
                }
                links.push(directive);
            }
            self.link = link;
            self.compile = compile;
            self.preLink = null;
        }
        return function(module) {
            return new Compiler(module);
        };
    });
    //! src/framework/scope.js
    internal("framework.scope", function() {
        var prototype = "prototype";
        var err = "error";
        var winConsole = console;
        var counter = 1;
        function toArgsArray(args) {
            return Array[prototype].slice.call(args, 0) || [];
        }
        function every(list, fn) {
            var returnVal = true;
            var i = 0, len = list.length;
            while (i < len) {
                if (!fn(list[i])) {
                    returnVal = false;
                }
                i += 1;
            }
            return returnVal;
        }
        function generateId() {
            return (counter++).toString(36);
        }
        function initWatchVal() {}
        function Scope() {
            var self = this;
            self.$id = generateId();
            self.$w = [];
            self.$lw = null;
            self.$aQ = [];
            self.$pQ = [];
            self.$r = self;
            self.$c = [];
            self.$l = {};
            self.$ph = null;
        }
        var scopePrototype = Scope.prototype;
        scopePrototype.$watch = function(watchFn, listenerFn, deep) {
            var self = this, watch;
            if (typeof watchFn === "string") {
                watch = function() {
                    return self.interpolate(self, watchFn);
                };
            } else {
                watch = watchFn;
            }
            var watcher = {
                watchFn: watch,
                listenerFn: listenerFn || function() {},
                deep: !!deep,
                last: initWatchVal
            };
            self.$w.unshift(watcher);
            self.$r.$lw = null;
            self.$lw = null;
            return function() {
                var index = self.$w.indexOf(watcher);
                if (index >= 0) {
                    self.$w.splice(index, 1);
                    self.$r.$lw = null;
                }
            };
        };
        scopePrototype.$$digestOnce = function() {
            var dirty = false;
            var continueLoop = true;
            var self = this;
            self.$$scopes(function(scope) {
                if (scope.$$ignore) {
                    return true;
                }
                var newValue, oldValue;
                var i = scope.$w.length;
                var watcher;
                while (i--) {
                    watcher = scope.$w[i];
                    if (watcher) {
                        newValue = watcher.watchFn(scope);
                        oldValue = watcher.last;
                        if (!scope.$$areEqual(newValue, oldValue, watcher.deep)) {
                            scope.$r.$lw = watcher;
                            watcher.last = watcher.deep ? JSON.stringify(newValue) : newValue;
                            watcher.listenerFn(newValue, oldValue === initWatchVal ? newValue : oldValue, scope);
                            dirty = true;
                        } else if (scope.$r.$lw === watcher) {
                            continueLoop = false;
                            return false;
                        }
                    }
                }
                return continueLoop;
            });
            return dirty;
        };
        scopePrototype.$digest = function() {
            var ttl = 10;
            var dirty;
            var self = this;
            self.$r.$lw = null;
            self.$beginPhase("$digest");
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
                if ((dirty || self.$aQ.length) && !ttl--) {
                    self.$clearPhase();
                    throw "10its";
                }
            } while (dirty || self.$aQ.length);
            while (self.$pQ.length) {
                try {
                    self.$pQ.shift()();
                } catch (e) {
                    winConsole[err](e);
                }
            }
            self.$clearPhase();
        };
        scopePrototype.$$areEqual = function(newValue, oldValue, deep) {
            if (deep) {
                return JSON.stringify(newValue) === oldValue;
            }
            return newValue === oldValue || typeof newValue === "number" && typeof oldValue === "number" && isNaN(newValue) && isNaN(oldValue);
        };
        scopePrototype.$eval = function(expr, locals) {
            return this.interpolate(this, expr, locals);
        };
        scopePrototype.$apply = function(expr) {
            var self = this;
            try {
                self.$beginPhase("$apply");
                if (expr) {
                    return self.$eval(expr);
                }
            } finally {
                self.$clearPhase();
                self.$r.$digest();
            }
        };
        scopePrototype.$evalAsync = function(expr) {
            var self = this;
            if (!self.$ph && !self.$aQ.length) {
                setTimeout(function() {
                    if (self.$aQ.length) {
                        self.$r.$digest();
                    }
                }, 0);
            }
            self.$aQ.push({
                scope: self,
                exp: expr
            });
        };
        scopePrototype.$beginPhase = function(phase) {
            var self = this;
            if (self.$ph) {
                return;
            }
            self.$ph = phase;
        };
        scopePrototype.$clearPhase = function() {
            this.$ph = null;
        };
        scopePrototype.$$postDigest = function(fn) {
            this.$pQ.push(fn);
        };
        scopePrototype.$new = function(isolated) {
            var child, self = this;
            if (isolated) {
                child = new Scope();
                child.$r = self.$r;
                child.$aQ = self.$aQ;
                child.$pQ = self.$pQ;
            } else {
                var ChildScope = function() {};
                ChildScope.prototype = self;
                child = new ChildScope();
            }
            self.$c.push(child);
            child.$id = generateId();
            child.$w = [];
            child.$l = {};
            child.$c = [];
            child.$p = self;
            return child;
        };
        scopePrototype.$ignore = function(enabled, childrenOnly) {
            var self = this;
            every(self.$c, function(scope) {
                scope.$$ignore = enabled;
            });
            if (!childrenOnly) {
                self.$$ignore = enabled;
            }
        };
        scopePrototype.$$scopes = function(fn) {
            var self = this;
            if (fn(self)) {
                return every(self.$c, function(child) {
                    return child.$$scopes(fn);
                });
            } else {
                return false;
            }
        };
        scopePrototype.$destroy = function() {
            var self = this;
            if (self === self.$r) {
                return;
            }
            var siblings = self.$p.$c;
            var indexOfThis = siblings.indexOf(self);
            if (indexOfThis >= 0) {
                self.$broadcast("$destroy");
                siblings.splice(indexOfThis, 1);
            }
        };
        scopePrototype.$on = function(eventName, listener) {
            var self = this;
            var listeners = self.$l[eventName];
            if (!listeners) {
                self.$l[eventName] = listeners = [];
            }
            listeners.push(listener);
            return function() {
                var index = listeners.indexOf(listener);
                if (index >= 0) {
                    listeners[index] = null;
                }
            };
        };
        scopePrototype.$emit = function(eventName) {
            var self = this;
            if (self.$$ignore && self.eventName !== "$destroy") {
                return;
            }
            var propagationStopped = false;
            var event = {
                name: eventName,
                targetScope: self,
                stopPropagation: function() {
                    propagationStopped = true;
                },
                preventDefault: function() {
                    event.defaultPrevented = true;
                }
            };
            var additionalArgs = toArgsArray(arguments);
            additionalArgs.shift();
            var listenerArgs = [ event ].concat(additionalArgs);
            var scope = self;
            do {
                event.currentScope = scope;
                scope.$$fire(eventName, listenerArgs);
                scope = scope.$p;
            } while (scope && !propagationStopped);
            return event;
        };
        scopePrototype.$broadcast = function(eventName) {
            var self = this;
            if (self.$$ignore && self.eventName !== "$destroy") {
                return;
            }
            var event = {
                name: eventName,
                targetScope: self,
                preventDefault: function() {
                    event.defaultPrevented = true;
                }
            };
            var additionalArgs = toArgsArray(arguments);
            additionalArgs.shift();
            var listenerArgs = [ event ].concat(additionalArgs);
            self.$$scopes(function(scope) {
                event.currentScope = scope;
                scope.$$fire(eventName, listenerArgs);
                return true;
            });
            return event;
        };
        scopePrototype.$$fire = function(eventName, listenerArgs) {
            var listeners = this.$l[eventName] || [];
            var i = 0;
            while (i < listeners.length) {
                if (listeners[i] === null) {
                    listeners.splice(i, 1);
                } else {
                    listeners[i].apply(null, listenerArgs);
                    i++;
                }
            }
            return event;
        };
        return function() {
            return new Scope();
        };
    });
    //! src/utils/formatters/removeHTMLComments.js
    define("removeHTMLComments", function() {
        var removeHTMLComments = function(htmlStr) {
            htmlStr = htmlStr + "";
            return htmlStr.replace(/<!--[\s\S]*?-->/g, "");
        };
        return removeHTMLComments;
    });
    for (var name in $$cache) {
        resolve(name, $$cache[name]);
    }
})(this["hb"] || {}, function() {
    return this;
}());