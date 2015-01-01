(function(exports, global) {
    global["utils"] = exports;
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
                if ($$pending[injectionName]) {
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
                $$internals[name] = fn.apply(null, args);
            } else {
                exports[name] = fn.apply(null, args);
            }
        }
        exports.$$cache = $$cache;
        exports.$$internals = $$internals;
        exports.$$pending = $$pending;
        delete $$pending[name];
    };
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
    //! src/framework/debug/scope.js
    internal("debug.scope", [ "framework" ], function(framework) {
        var api = {};
        function count(scope, prop) {
            prop = prop || "$$watchers";
            var c = scope[prop].length, result = {
                $id: scope.$id
            }, next = scope.$$childHead, child;
            result[prop] = c;
            result.childTotal = 0;
            result._children = [];
            while (next) {
                child = count(next);
                result._children.push(child);
                result.childTotal += child[prop] + child.childTotal;
                next = next.$$nextSibling;
            }
            return result;
        }
        api.count = count;
        framework.debug.scope = api;
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
    //! src/utils/browser/ready.js
    define("ready", function() {
        var callbacks = [], win = window, doc = document, ADD_EVENT_LISTENER = "addEventListener", REMOVE_EVENT_LISTENER = "removeEventListener", ATTACH_EVENT = "attachEvent", DETACH_EVENT = "detachEvent", DOM_CONTENT_LOADED = "DOMContentLoaded", ON_READY_STATE_CHANGE = "onreadystatechange", COMPLETE = "complete", READY_STATE = "readyState";
        var ready = function(callback) {
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
        return ready;
    });
    //! src/framework/directives/autoscroll.js
    internal("directives.autoscroll", [ "framework", "query", "query.bind", "query.unbindAll" ], function(framework, query) {
        return framework.directives.autoscroll = function(module) {
            module.directive("hbAutoscroll", function() {
                var $ = query;
                var win = window;
                function outerHeight(el) {
                    var height = el.offsetHeight;
                    var style = getComputedStyle(el);
                    height += parseInt(style.marginTop) + parseInt(style.marginBottom);
                    return height;
                }
                var easeInOutCubic = function(t) {
                    return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
                };
                var position = function(start, end, elapsed, duration) {
                    if (elapsed > duration) {
                        return end;
                    }
                    return start + (end - start) * easeInOutCubic(elapsed / duration);
                };
                var smoothScroll = function(scrollEl, scrollFrom, scrollTo, duration, callback) {
                    duration = duration === undefined ? 500 : duration;
                    scrollTo = parseInt(scrollTo);
                    var clock = Date.now();
                    var requestAnimationFrame = win.requestAnimationFrame || win.mozRequestAnimationFrame || win.webkitRequestAnimationFrame || function(fn) {
                        win.setTimeout(fn, 15);
                    };
                    var step = function() {
                        var elapsed = Date.now() - clock;
                        scrollEl.scrollTop = (0, position(scrollFrom, scrollTo, elapsed, duration));
                        if (elapsed > duration) {
                            if (typeof callback === "function") {
                                callback(scrollEl);
                            }
                        } else {
                            requestAnimationFrame(step);
                        }
                    };
                    step();
                };
                return {
                    link: function(scope, el, alias) {
                        var inputs = el.querySelectorAll("input,textarea");
                        var options = module.interpolate(scope, alias.value);
                        var scrollEl = el.querySelector("*");
                        function scrollIt() {
                            setTimeout(function() {
                                var clock = Date.now();
                                smoothScroll(el, el.scrollTop, outerHeight(scrollEl) - outerHeight(el), options.duration);
                            }, options.delay || 10);
                        }
                        scope.$watch(options.watch, scrollIt);
                        for (var e in inputs) {
                            $(inputs[e]).bind("focus", scrollIt);
                        }
                        scope.$on("$destroy", function() {
                            for (var e in inputs) {
                                $(inputs[e]).unbindAll();
                            }
                        });
                    }
                };
            });
        };
    });
    //! src/utils/query/query.js
    define("query", function() {
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
    //! src/framework/directives/bridge.js
    internal("directives.bridge", [ "framework", "debounce" ], function(framework, debounce) {
        return framework.directives.bridge = function(module) {
            module.directive("hbBridge", function() {
                return {
                    scope: true,
                    link: function(scope, el, alias) {
                        var ngScope = angular.element(el).scope(), fire = scope.$$fire, i, unwatchers = [], len = el.attributes.length, attr, name, $apply, fn, camelName, value;
                        scope.$$fire = function(eventName, args) {
                            fire.call(scope, eventName, args);
                            var cloneArgs = args.slice();
                            cloneArgs.unshift(eventName);
                            ngScope.$emit.apply(ngScope, cloneArgs);
                            ngScope.$apply();
                        };
                        $apply = debounce(function() {
                            scope.$apply();
                        });
                        function getCamelName(name) {
                            var camel = name.split("-"), i, len = camel.length;
                            for (i = 0; i < len; i += 1) {
                                camel[i][0] = camel[i][0].toUpperCase();
                            }
                            return camel.join("");
                        }
                        function createUpdate(camelName) {
                            return function(newVal) {
                                scope[camelName] = newVal;
                                $apply();
                            };
                        }
                        for (i = 0; i < len; i += 1) {
                            attr = el.attributes[i];
                            name = attr.name || attr.nodeName || attr.localName;
                            camelName = getCamelName(name);
                            value = el.getAttribute(name);
                            if (value && name.indexOf("ng-") !== 0 && name !== module.name + "-id" && !module.val(camelName)) {
                                console.log("watching " + name);
                                fn = createUpdate(camelName);
                                unwatchers.push(ngScope.$watch(value, fn, true));
                                fn(ngScope.$eval(value));
                            }
                        }
                        scope.$on("$destroy", function() {
                            while (unwatchers.length) {
                                unwatchers.pop()();
                            }
                        });
                    }
                };
            });
        };
    });
    //! src/utils/async/debounce.js
    define("debounce", function(debounce) {
        var debounce = function(func, wait, immediate) {
            var timeout;
            return function() {
                var context = this, args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    timeout = null;
                    if (!immediate) {
                        func.apply(context, args);
                    }
                }, wait);
                if (immediate && !timeout) {
                    func.apply(context, args);
                }
            };
        };
        return debounce;
    });
    //! src/framework/directives/class.js
    internal("directives.class", [ "framework", "query", "query.class" ], function(framework, query) {
        return framework.directives.class = function(module) {
            module.directive("hbClass", function() {
                var $ = query;
                return {
                    link: function(scope, el, alias) {
                        var $el = $(el);
                        scope.$watch(function() {
                            var classes = module.interpolate(scope, alias.value);
                            for (var e in classes) {
                                if (classes.hasOwnProperty(e)) {
                                    if (classes[e]) {
                                        $el.addClass(e);
                                    } else {
                                        $el.removeClass(e);
                                    }
                                }
                            }
                        });
                    }
                };
            });
        };
    });
    //! src/utils/query/modify/class.js
    internal("query.class", [ "query", "isDefined" ], function(query, isDefined) {
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
                if (isDefined(className)) {
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
    });
    //! src/utils/validators/isDefined.js
    define("isDefined", function() {
        var isDefined = function(val) {
            return typeof val !== "undefined";
        };
        return isDefined;
    });
    //! src/framework/directives/cloak.js
    internal("directives.cloak", [ "framework" ], function(framework) {
        return framework.directives.cloak = function(module) {
            module.directive("hbCloak", function() {
                return {
                    link: function(scope, el, alias) {
                        el.removeAttribute(alias.name);
                    }
                };
            });
        };
    });
    //! src/framework/directives/disabled.js
    internal("directives.disabled", [ "framework" ], function(framework) {
        return framework.directives.disabled = function(module) {
            module.directive("hbDisabled", function() {
                return {
                    link: function(scope, el, alias) {
                        var disabled = "disabled";
                        scope.$watch(alias.value, function(newVal) {
                            if (newVal) {
                                el.setAttribute(disabled, disabled);
                            } else {
                                el.removeAttribute(disabled);
                            }
                        });
                    }
                };
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
    //! src/framework/directives/html.js
    internal("directives.html", [ "framework" ], function(framework) {
        return framework.directives.html = function(module) {
            module.directive("hbHtml", function() {
                return {
                    link: function(scope, el, alias) {
                        scope.$watch(alias.value, function(newVal) {
                            el.innerHTML = newVal || "";
                        });
                    }
                };
            });
        };
    });
    //! src/framework/directives/ignore.js
    internal("directives.ignore", [ "framework" ], function(framework) {
        return framework.directives.ignore = function(module) {
            module.directive("hbIgnore", function() {
                return {
                    scope: true,
                    link: function(scope, el, alias) {
                        scope.$ignore(true);
                    }
                };
            });
        };
    });
    //! src/framework/directives/model.js
    internal("directives.model", [ "framework", "resolve", "query", "query.bind", "query.unbind", "query.unbindAll" ], function(framework, resolve, query) {
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
    //! src/framework/directives/repeat.js
    internal("directives.repeat", [ "framework", "each" ], function(framework, each) {
        return framework.directives.repeat = function(module) {
            function trimStrings(str, index, list) {
                list[index] = str && str.trim();
            }
            module.directive("hbRepeat", function() {
                return {
                    link: function(scope, el, alias) {
                        var template = el.children[0].outerHTML;
                        el.removeChild(el.children[0]);
                        var statement = alias.value;
                        statement = each.call({
                            all: true
                        }, statement.split(/\s+in\s+/), trimStrings);
                        var itemName = statement[0], watch = statement[1];
                        function render(list, oldList) {
                            var i = 0, len = Math.max(list.length, el.children.length), child, s, data;
                            while (i < len) {
                                child = el.children[i];
                                if (!child) {
                                    data = {};
                                    data[itemName] = list[i];
                                    data.$index = i;
                                    child = module.addChild(el, template, scope.$new(), data);
                                } else if (list[i]) {
                                    s = child.scope;
                                    s[itemName] = list[i];
                                    s.$index = i;
                                } else {
                                    child.scope.$destroy();
                                }
                                i += 1;
                            }
                        }
                        scope.$watch(watch, render, true);
                    }
                };
            });
        };
    });
    //! src/framework/directives/show.js
    internal("directives.show", [ "framework" ], function(framework) {
        return framework.directives.show = function(module) {
            module.directive("hbShow", function() {
                return {
                    scope: true,
                    link: function(scope, el, alias) {
                        scope.$watch(alias.value, function(newVal, oldVal) {
                            if (newVal) {
                                scope.$ignore(false, true);
                                el.style.display = null;
                            } else {
                                scope.$ignore(true, true);
                                el.style.display = "none";
                            }
                        });
                    }
                };
            });
        };
    });
    //! src/framework/directives/src.js
    internal("directives.src", [ "framework" ], function(framework) {
        return framework.directives.src = function(module) {
            return module.directive("hbSrc", function() {
                return {
                    link: function(scope, el, alias) {
                        var src = "src";
                        scope.$watch(alias.value, function(newVal) {
                            if (newVal) {
                                el.setAttribute(src, newVal);
                            } else {
                                el.removeAttribute(src);
                            }
                        });
                    }
                };
            });
        };
    });
    //! src/framework/directives/view.js
    internal("directives.view", [ "framework" ], function(framework) {
        return framework.directives.view = function(module) {
            module.directive("hbView", function() {
                return {
                    link: function(scope, el, alias) {
                        scope.title = "view";
                        function onChange(newVal) {
                            if (el.children.length) {
                                module.removeChild(el.children[0]);
                            }
                            return module.addChild(el, module.val(newVal));
                        }
                        if (alias.value) {
                            scope.$watch(alias.value, onChange);
                        }
                        scope.$on("router::change", function(evt, state, params, prevState) {
                            var child = onChange(state.templateName, null, params);
                            if (child) {
                                child.scope.$state = {
                                    current: state,
                                    params: params,
                                    prev: prevState
                                };
                            }
                            scope.$apply();
                        });
                    }
                };
            });
        };
    });
    //! src/framework/errors/debug.js
    internal("errors.build", [ "framework" ], function(framework) {
        framework.errors.MESSAGES = {
            E1: "Trying to assign multiple scopes to the same dom element is not permitted.",
            E2: "Unable to find element",
            E3: "Exceeded max digests of ",
            E4: "parent element not found in %o",
            E5: "property is not of type object",
            E6a: 'Error evaluating: "',
            E6b: '" against %o',
            E7: "$digest already in progress.",
            E8: "Name required to instantiate module",
            E9: "Injection not found for ",
            E10: "This element has already been compiled"
        };
    });
    //! src/framework/filters/upper.js
    internal("filters.lower", [ "framework" ], function(framework) {
        return framework.filters.upper = function(module) {
            module.filter("upper", function() {
                return function(val) {
                    return (val + "").toUpperCase();
                };
            });
        };
    });
    //! src/framework/module.js
    /*!
 import directives.app
 import directives.model
 import directives.events
 errors.build
 */
    define("module", [ "injector", "interpolator", "framework", "framework.compiler", "framework.scope", "removeHTMLComments" ], function(injector, interpolator, framework, compiler, scope, removeHTMLComments) {
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
                    this.element(el);
                    this.ready();
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
                    utils.each(list, removeChild);
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
            function use(list, namesStr) {
                var name;
                var names = namesStr.split(" ");
                for (var e in names) {
                    name = names[e];
                    if (list.hasOwnProperty(name)) {
                        list[name](this);
                    }
                }
            }
            function useDirectives(namesStr) {
                use.apply(self, [ framework.directives, namesStr ]);
            }
            function usePlugins(namesStr) {
                use.apply(self, [ framework.plugins, namesStr ]);
            }
            function useFilters(namesStr) {
                use.apply(self, [ framework.filters, namesStr ]);
            }
            function ready() {
                if (self.preInit) {
                    self.preInit();
                }
                while (bootstraps.length) {
                    _injector.invoke(bootstraps.shift(), self);
                }
                rootScope.$apply();
                rootScope.$broadcast("module::ready");
            }
            self.bindingMarkup = [ ":=", "=:" ];
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
            self.useDirectives = useDirectives;
            self.usePlugins = usePlugins;
            self.useFilters = useFilters;
            self.ready = ready;
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
    //! src/framework/plugins/http.js
    internal("plugins.http", [ "framework", "http" ], function(framework, http) {
        return framework.plugins.http = function(module) {
            return module.injector.val("http", http);
        };
    });
    //! src/utils/ajax/http.js
    define("http", function() {
        var serialize = function(obj) {
            var str = [];
            for (var p in obj) if (obj.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
            return str.join("&");
        };
        var win = window, CORSxhr = function() {
            var xhr;
            if (win.XMLHttpRequest && "withCredentials" in new win.XMLHttpRequest()) {
                xhr = win.XMLHttpRequest;
            } else if (win.XDomainRequest) {
                xhr = win.XDomainRequest;
            }
            return xhr;
        }(), methods = [ "head", "get", "post", "put", "delete" ], i, methodsLength = methods.length, result = {};
        function Request(options) {
            this.init(options);
        }
        function getRequestResult(that) {
            var headers = parseResponseHeaders(this.getAllResponseHeaders());
            var response = this.responseText;
            if (headers.contentType && headers.contentType.indexOf("application/json") !== -1) {
                response = response ? JSON.parse(response) : response;
            }
            return {
                data: response,
                request: {
                    method: that.method,
                    url: that.url,
                    data: that.data,
                    headers: that.headers
                },
                headers: headers,
                status: this.status
            };
        }
        Request.prototype.init = function(options) {
            var that = this;
            that.xhr = new CORSxhr();
            that.method = options.method;
            that.url = options.url;
            that.success = options.success;
            that.error = options.error;
            that.data = options.data;
            that.headers = options.headers;
            if (options.credentials === true) {
                that.xhr.withCredentials = true;
            }
            that.send();
            return that;
        };
        Request.prototype.send = function() {
            var that = this;
            if (that.method === "GET" && that.data) {
                var concat = that.url.indexOf("?") > -1 ? "&" : "?";
                that.url += concat + serialize(that.data);
            } else {
                that.data = JSON.stringify(that.data);
            }
            if (that.success !== undefined) {
                that.xhr.onload = function() {
                    var result = getRequestResult.call(this, that);
                    if (this.status >= 200 && this.status < 300) {
                        that.success.call(this, result);
                    } else if (that.error !== undefined) {
                        that.error.call(this, result);
                    }
                };
            }
            if (that.error !== undefined) {
                that.xhr.error = function() {
                    var result = getRequestResult.call(this, that);
                    that.error.call(this, result);
                };
            }
            that.xhr.open(that.method, that.url, true);
            if (that.headers !== undefined) {
                that.setHeaders();
            }
            that.xhr.send(that.data, true);
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
        function parseResponseHeaders(str) {
            var list = str.split("\n");
            var headers = {};
            var parts;
            var i = 0, len = list.length;
            while (i < len) {
                parts = list[i].split(": ");
                if (parts[0] && parts[1]) {
                    parts[0] = parts[0].split("-").join("").split("");
                    parts[0][0] = parts[0][0].toLowerCase();
                    headers[parts[0].join("")] = parts[1];
                }
                i += 1;
            }
            return headers;
        }
        function addDefaults(options, defaults) {
            for (var i in defaults) {
                if (defaults.hasOwnProperty(i) && options[i] === undefined) {
                    if (typeof defaults[i] === "object") {
                        options[i] = {};
                        addDefaults(options[i], defaults[i]);
                    } else {
                        options[i] = defaults[i];
                    }
                }
            }
            return options;
        }
        function handleMock(options) {
            return !!(result.mocker && result.mocker.handle(options, Request));
        }
        for (i = 0; i < methodsLength; i += 1) {
            (function() {
                var method = methods[i];
                result[method] = function(url, success, error) {
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
                        if (typeof error === "function") {
                            options.error = error;
                        }
                        options.url = url;
                    }
                    options.method = method.toUpperCase();
                    addDefaults(options, result.defaults);
                    if (result.handleMock(options)) {
                        return;
                    }
                    return new Request(options).xhr;
                };
            })();
        }
        result.mocker = null;
        result.handleMock = handleMock;
        result.defaults = {
            headers: {}
        };
        return result;
    });
    //! src/framework/plugins/mocks.js
    internal("plugins.mocks", [ "framework" ], function(framework) {
        function Mocks(module) {
            var injector = module.injector;
            injector.val("$window", new Win());
        }
        function Win() {
            this._hist = [];
            this._listeners = {};
            this.history = new Hist(this);
            this.document = new Doc(this);
            this.document.location.href = "http://test.com/";
        }
        Win.prototype = {
            addEventListener: function(evt, fn) {
                this._listeners[evt] = this._listeners[evt] || [];
                this._listeners[evt].push(fn);
                this._hist.push({
                    method: "addEventListener",
                    evt: evt,
                    fn: fn
                });
            },
            removeEventListener: function(evt, fn) {
                if (this._listeners[evt]) {
                    var index = this._listeners[evt].indexOf(fn);
                    if (index !== -1) {
                        this._listeners[evt].splice(index, 1);
                    }
                }
            },
            dispatchEvent: function(evt) {
                if (this._listeners[evt]) {
                    utils.each(this._listeners[evt], function(fn) {
                        fn(evt);
                    });
                }
            }
        };
        function Doc(dispatcher) {
            this._hist = [];
            this._dispatcher = dispatcher;
            this.location = new Loc(dispatcher);
        }
        Doc.prototype = {};
        function Hist(dispatcher) {
            this._hist = [];
            this._dispatcher = dispatcher;
        }
        Hist.prototype = {
            state: {},
            pushState: function(state, title, url) {
                this._hist.push({
                    method: "pushState",
                    state: state,
                    title: title,
                    url: url
                });
                this.state = state;
                this.title = title;
                this.url = url;
                this._dispatcher.document.location._data.href = url;
            },
            replaceState: function(state, title, url) {
                this._hist.push({
                    method: "replaceState",
                    state: state,
                    title: title,
                    url: url
                });
                this.state = state;
                this.title = title;
                this.url = url;
                this._dispatcher.document.location._data.href = url;
            }
        };
        function parseUrl(url, prevData) {
            var parts, searchResult = {}, search, hash, protocol, domain, pathname;
            parts = url.split("#");
            hash = parts[1] || "";
            search = hash && hash.indexOf("?") !== -1 ? hash.split("?").pop() : "";
            parts = parts[0].split(":");
            protocol = parts[0] || prevData.protocol;
            parts = parts[1] ? parts[1].replace("//", "").split("/") : [ prevData.domain, prevData.pathname ];
            domain = parts.shift().replace("/", "");
            while (!parts[0] && parts.length) {
                parts.shift();
            }
            pathname = ("/" + parts.join("/")).replace("//", "/");
            utils.each(search.split("&"), keyValue, searchResult);
            return {
                domain: domain,
                hash: hash,
                href: url || "",
                pathname: pathname,
                protocol: protocol,
                search: search
            };
        }
        function generateUrl(data) {
            return data.protocol + "://" + data.domain + data.pathname + (data.hash ? "#" + data.hash : "") + (data.search ? "?" + data.search : "");
        }
        function keyValue(str, result) {
            var parts = str.split("");
            result[parts[0]] = parts[1];
        }
        function Loc(dispatcher) {
            this._hist = [];
            this._data = {};
            this._dispatcher = dispatcher;
        }
        Loc.prototype = {
            get href() {
                return this._data.href;
            },
            set href(val) {
                this._data = parseUrl(val, this._data);
                this._dispatcher.dispatchEvent("popstate");
            },
            get hash() {
                return this._data.hash;
            },
            set hash(val) {
                this._data.hash = val;
                this._data.href = generateUrl(this._data);
                this._dispatcher.dispatchEvent("popstate");
            },
            get pathname() {
                return this._data.pathname;
            }
        };
        return framework.plugins.mocks = function(module) {
            return module.mocks = module.mocks || module.injector.instantiate(Mocks);
        };
    });
    //! src/framework/plugins/router.js
    internal("plugins.router", [ "framework" ], function(framework) {
        function Router(module, $rootScope, $window) {
            var self = this, events = {
                CHANGE: "router::change"
            }, $location = $window.document.location, $history = $window.history, prev, current, states = {}, base = $location.pathname, lastHashUrl;
            function add(state) {
                if (typeof state === "string") {
                    return addState(arguments[1], state);
                }
                utils.each.call({
                    all: true
                }, state, addState);
            }
            function addState(state, id) {
                state.id = id;
                states[id] = state;
                state.templateName = state.templateName || id;
                if (state.template) {
                    module.val(state.templateName, state.template);
                }
            }
            function remove(id) {
                delete states[id];
            }
            function cleanUrl(url) {
                return url.split("#").join("");
            }
            function generateUrl(url, values) {
                url = cleanUrl(url);
                var used = {}, unusedUrlParams = [], result = {
                    url: values && url.replace(/(\:\w+)/g, function(match, p1) {
                        var str = p1.substr(1);
                        used[str] = true;
                        return values[str];
                    })
                };
                if (values) {
                    utils.each.call({
                        all: true
                    }, values, unusedParams, used, unusedUrlParams);
                    if (unusedUrlParams.length) {
                        result.url = result.url.split("?").shift() + "?" + unusedUrlParams.join("&");
                    }
                }
                return result;
            }
            function unusedParams(value, prop, list, used, unusedUrlParams) {
                if (!used[prop]) {
                    unusedUrlParams.push(prop + "=" + value);
                }
            }
            function resolveUrl(evt, skipPush) {
                var url = cleanUrl($location.hash), state;
                state = getStateFromPath(url);
                if (!state) {
                    url = self.otherwise;
                    skipPush = true;
                    state = getStateFromPath(url);
                }
                var params = extractParams(state, url);
                go(state.id, params, skipPush);
            }
            function keyValues(key, index, list, result, parts) {
                if (key[0] === ":") {
                    result[key.replace(":", "")] = parts[index];
                }
            }
            function urlKeyValues(str, result) {
                var parts = str.split("=");
                result[parts[0]] = parts[1];
            }
            function extractParams(state, url) {
                var parts = url.split("?"), searchParams = parts[1], result = {};
                parts = parts[0].split("/");
                utils.each.call({
                    all: true
                }, state.url.split("/"), keyValues, result, parts);
                if (searchParams) {
                    utils.each(searchParams.split("&"), urlKeyValues, result);
                }
                return result;
            }
            function doesStateMatchPath(state, url) {
                if (!url) {
                    return;
                }
                var escUrl = state.url.replace(/[-[\]{}()*+?.,\\^$|#\s\/]/g, "\\$&");
                var rx = new RegExp("^" + escUrl.replace(/(:\w+)/g, "\\w+") + "$", "i");
                if (url.match(rx)) {
                    return state;
                }
            }
            function getStateFromPath(url) {
                var state = utils.each(states, doesStateMatchPath, url.split("?").shift());
                if (state && state.url) {
                    return state;
                }
                return null;
            }
            function go(stateName, params, skipPush) {
                var state = states[stateName], path = generateUrl(state.url, params), url = path.url || state.url;
                if ($history.pushState) {
                    if (skipPush || !$history.state) {
                        $history.replaceState({
                            url: url,
                            params: params
                        }, "", base + "#" + url);
                    } else if ($history.state && $history.state.url !== url) {
                        $history.pushState({
                            url: url,
                            params: params
                        }, "", base + "#" + url);
                    }
                } else if (!skipPush) {
                    if ($location.hash === "#" + url) {
                        return;
                    }
                    $location.hash = "#" + url;
                }
                change(state, params);
            }
            function change(state, params) {
                lastHashUrl = $location.hash.replace("#", "");
                self.prev = prev = current;
                self.current = current = state;
                self.params = params;
                $rootScope.$broadcast(self.events.CHANGE, current, params, prev);
            }
            function onHashCheck() {
                var hashUrl = $location.hash.replace("#", "");
                if (hashUrl !== lastHashUrl) {
                    resolveUrl(null, true);
                    lastHashUrl = hashUrl;
                }
            }
            framework.on($window, "popstate", resolveUrl);
            framework.on($window, "hashchange", onHashCheck);
            setInterval(onHashCheck, 100);
            self.events = events;
            self.go = $rootScope.go = go;
            self.resolveUrl = resolveUrl;
            self.otherwise = "/";
            self.add = add;
            self.remove = remove;
            self.states = states;
            $rootScope.$on("module::ready", resolveUrl);
        }
        return framework.plugins.router = function(module) {
            var result = module.router = module.router || module.injector.instantiate(Router);
            return module.injector.val("router", result);
        };
    });
    //! src/utils/ajax/jsonp.js
    internal("http.jsonp", [ "http" ], function(http) {
        var defaultName = "_jsonpcb";
        function getNextName() {
            var i = 0, name = defaultName;
            while (window[name]) {
                name = defaultName + i;
                i += 1;
            }
            return name;
        }
        function createCallback(name, callback, script) {
            window[name] = function(data) {
                delete window[name];
                callback(data);
                document.head.removeChild(script);
            };
        }
        http.jsonp = function(url, success, error) {
            var name = getNextName(), paramsAry, i, script, options = {};
            if (url === undefined) {
                throw new Error("CORS: url must be defined");
            }
            if (typeof url === "object") {
                options = url;
            } else {
                if (typeof success === "function") {
                    options.success = success;
                }
                if (typeof error === "function") {
                    options.error = error;
                }
                options.url = url;
            }
            options.callback = name;
            if (http.handleMock(options)) {
                return;
            }
            script = document.createElement("script");
            script.type = "text/javascript";
            script.onload = function() {
                setTimeout(function() {
                    if (window[name]) {
                        error(url + " failed.");
                    }
                });
            };
            createCallback(name, success, script);
            paramsAry = [];
            for (i in options) {
                if (options.hasOwnProperty(i)) {
                    paramsAry.push(i + "=" + options[i]);
                }
            }
            script.src = url + "?" + paramsAry.join("&");
            document.head.appendChild(script);
        };
        return http;
    });
    //! src/utils/ajax/mock.js
    internal("http.mock", [ "http" ], function(http) {
        var registry = [], result;
        function matchMock(options) {
            var i, len = registry.length, mock, result;
            for (i = 0; i < len; i += 1) {
                mock = registry[i];
                if (mock.type === "string" || mock.type === "object") {
                    result = options.url.match(mock.matcher);
                } else if (mock.type === "function") {
                    result = mock.matcher(options);
                }
                if (result) {
                    result = mock;
                    break;
                }
            }
            return result;
        }
        function warn() {
            if (window.console && console.warn) {
                console.warn.apply(console, arguments);
            }
        }
        http.mock = function(value) {
            http.mocker = value ? result : null;
        };
        result = {
            create: function(matcher, preCallHandler, postCallHandler) {
                registry.push({
                    matcher: matcher,
                    type: typeof matcher,
                    pre: preCallHandler,
                    post: postCallHandler
                });
            },
            handle: function(options, Request) {
                var mock = matchMock(options), response, onload;
                function preNext() {
                    if (options.data === undefined) {
                        options.method = "GET";
                        response = new Request(options);
                        if (mock.post) {
                            onload = response.xhr.onload;
                            response.xhr.onload = function() {
                                mock.post(function() {
                                    onload.apply(response.xhr);
                                }, options, result);
                            };
                        }
                    } else if (mock.post) {
                        mock.post(postNext, options, http);
                    }
                }
                function postNext() {
                    options.status = options.status || 200;
                    if (options.success && options.status >= 200 && options.status <= 299) {
                        options.success(options);
                    } else if (options.error) {
                        options.error(options);
                    } else {
                        warn("Invalid options object for http.");
                    }
                }
                if (mock && mock.pre) {
                    mock.pre(preNext, options, http);
                    return true;
                }
                warn("No adapter found for " + options.url + ".");
                return false;
            }
        };
        return result;
    });
    //! src/utils/array/aggregate.js
    define("aggregate", function() {
        var aggregate = function(array, formatter) {
            var i = 0, len = array.length, returnVal = [], hash = {};
            while (i < len) {
                formatter(hash, array[i]);
                i += 1;
            }
            for (i in hash) {
                if (hash.hasOwnProperty(i)) {
                    returnVal.push(hash[i]);
                }
            }
            return returnVal;
        };
        aggregate.minute = function(prop) {
            var key;
            this.format = function(hash, data) {
                key = data[prop].getMinutes();
                hash[key] = hash[key] || {
                    date: data[prop].getTime(),
                    value: 0
                };
                hash[key].value += 1;
            };
        };
        aggregate.hour = function(prop) {
            var key;
            return function(hash, data) {
                key = data[prop].getHours();
                hash[key] = hash[key] || {
                    date: data[prop].getTime(),
                    value: 0
                };
                hash[key].value += 1;
            };
        };
        return aggregate;
    });
    //! src/utils/array/selection.js
    define("selection", function() {
        var selection = function(list, target) {
            var selectedItem, selectedIndex = -1;
            function select(item, index) {
                var previous;
                if (selectedItem !== item || selectedIndex !== index) {
                    previous = selectedItem;
                    selectedItem = item;
                    selectedIndex = index;
                    if (target.dispatch) {
                        target.dispatch(target.constructor.name + "::selectionChange", selectedItem, previous);
                    }
                }
            }
            function getSelectedItem() {
                return selectedItem;
            }
            function setSelectedItem(item) {
                var index = list.indexOf(item);
                if (index !== -1) {
                    select(item, index);
                }
            }
            function getSelectedIndex() {
                return selectedIndex;
            }
            function setSelectedIndex(index) {
                if (list[index]) {
                    select(list[index], index);
                }
            }
            target = target || {};
            target.getSelectedItem = getSelectedItem;
            target.setSelectedItem = setSelectedItem;
            target.getSelectedIndex = getSelectedIndex;
            target.setSelectedIndex = setSelectedIndex;
            return target;
        };
        return selection;
    });
    //! src/utils/array/sort.js
    define("sort", function() {
        function partition(array, left, right, fn) {
            var cmp = array[right - 1], minEnd = left, maxEnd, dir = 0;
            for (maxEnd = left; maxEnd < right - 1; maxEnd += 1) {
                dir = fn(array[maxEnd], cmp);
                if (dir < 0) {
                    if (maxEnd !== minEnd) {
                        swap(array, maxEnd, minEnd);
                    }
                    minEnd += 1;
                }
            }
            if (fn(array[minEnd], cmp)) {
                swap(array, minEnd, right - 1);
            }
            return minEnd;
        }
        function swap(array, i, j) {
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
            return array;
        }
        function quickSort(array, left, right, fn) {
            if (left < right) {
                var p = partition(array, left, right, fn);
                quickSort(array, left, p, fn);
                quickSort(array, p + 1, right, fn);
            }
            return array;
        }
        return function(array, fn) {
            var result = quickSort(array, 0, array.length, fn);
            return result;
        };
    });
    //! src/utils/array/sortOn.js
    define("sortOn", [ "sort" ], function(sort) {
        var sortOn = function(array, property, desc) {
            if (desc) {
                desc = 1;
            } else {
                desc = 0;
            }
            var sortfunc = function(a, b) {
                return desc ? b[property] > a[property] ? 1 : a[property] > b[property] ? -1 : 0 : b[property] < a[property] ? 1 : a[property] < b[property] ? -1 : 0;
            };
            return sort(array, sortfunc);
        };
        return sortOn;
    });
    //! src/utils/async/defer.js
    define("defer", function() {
        var defer = function(undef) {
            var nextTick, isFunc = function(f) {
                return typeof f === "function";
            }, isArray = function(a) {
                return Array.isArray ? Array.isArray(a) : a instanceof Array;
            }, isObjOrFunc = function(o) {
                return !!(o && (typeof o).match(/function|object/));
            }, isNotVal = function(v) {
                return v === false || v === undef || v === null;
            }, slice = function(a, offset) {
                return [].slice.call(a, offset);
            }, undefStr = "undefined", tErr = typeof TypeError === undefStr ? Error : TypeError;
            if (typeof process !== undefStr && process.nextTick) {
                nextTick = process.nextTick;
            } else if (typeof MessageChannel !== undefStr) {
                var ntickChannel = new MessageChannel(), queue = [];
                ntickChannel.port1.onmessage = function() {
                    queue.length && queue.shift()();
                };
                nextTick = function(cb) {
                    queue.push(cb);
                    ntickChannel.port2.postMessage(0);
                };
            } else {
                nextTick = function(cb) {
                    setTimeout(cb, 0);
                };
            }
            function rethrow(e) {
                nextTick(function() {
                    throw e;
                });
            }
            function promise_success(fulfilled) {
                return this.then(fulfilled, undef);
            }
            function promise_error(failed) {
                return this.then(undef, failed);
            }
            function promise_apply(fulfilled, failed) {
                return this.then(function(a) {
                    return isFunc(fulfilled) ? fulfilled.apply(null, isArray(a) ? a : [ a ]) : defer.onlyFuncs ? a : fulfilled;
                }, failed || undef);
            }
            function promise_ensure(cb) {
                function _cb() {
                    cb();
                }
                this.then(_cb, _cb);
                return this;
            }
            function promise_nodify(cb) {
                return this.then(function(a) {
                    return isFunc(cb) ? cb.apply(null, isArray(a) ? a.splice(0, 0, undefined) && a : [ undefined, a ]) : defer.onlyFuncs ? a : cb;
                }, function(e) {
                    return cb(e);
                });
            }
            function promise_rethrow(failed) {
                return this.then(undef, failed ? function(e) {
                    failed(e);
                    throw e;
                } : rethrow);
            }
            var defer = function(alwaysAsync) {
                var alwaysAsyncFn = (undef !== alwaysAsync ? alwaysAsync : defer.alwaysAsync) ? nextTick : function(fn) {
                    fn();
                }, status = 0, pendings = [], value, _promise = {
                    then: function(fulfilled, failed) {
                        var d = defer();
                        pendings.push([ function(value) {
                            try {
                                if (isNotVal(fulfilled)) {
                                    d.resolve(value);
                                } else {
                                    d.resolve(isFunc(fulfilled) ? fulfilled(value) : defer.onlyFuncs ? value : fulfilled);
                                }
                            } catch (e) {
                                d.reject(e);
                            }
                        }, function(err) {
                            if (isNotVal(failed) || !isFunc(failed) && defer.onlyFuncs) {
                                d.reject(err);
                            }
                            if (failed) {
                                try {
                                    d.resolve(isFunc(failed) ? failed(err) : failed);
                                } catch (e) {
                                    d.reject(e);
                                }
                            }
                        } ]);
                        status !== 0 && alwaysAsyncFn(execCallbacks);
                        return d.promise;
                    },
                    success: promise_success,
                    error: promise_error,
                    otherwise: promise_error,
                    apply: promise_apply,
                    spread: promise_apply,
                    ensure: promise_ensure,
                    nodify: promise_nodify,
                    rethrow: promise_rethrow,
                    isPending: function() {
                        return !!(status === 0);
                    },
                    getStatus: function() {
                        return status;
                    }
                };
                _promise.toSource = _promise.toString = _promise.valueOf = function() {
                    return value === undef ? this : value;
                };
                function execCallbacks() {
                    if (status === 0) {
                        return;
                    }
                    var cbs = pendings, i = 0, l = cbs.length, cbIndex = ~status ? 0 : 1, cb;
                    pendings = [];
                    for (;i < l; i++) {
                        (cb = cbs[i][cbIndex]) && cb(value);
                    }
                }
                function _resolve(val) {
                    var done = false;
                    function once(f) {
                        return function(x) {
                            if (done) {
                                return undefined;
                            } else {
                                done = true;
                                return f(x);
                            }
                        };
                    }
                    if (status) {
                        return this;
                    }
                    try {
                        var then = isObjOrFunc(val) && val.then;
                        if (isFunc(then)) {
                            if (val === _promise) {
                                throw new tErr("Promise can't resolve itself");
                            }
                            then.call(val, once(_resolve), once(_reject));
                            return this;
                        }
                    } catch (e) {
                        once(_reject)(e);
                        return this;
                    }
                    alwaysAsyncFn(function() {
                        value = val;
                        status = 1;
                        execCallbacks();
                    });
                    return this;
                }
                function _reject(Err) {
                    status || alwaysAsyncFn(function() {
                        try {
                            throw Err;
                        } catch (e) {
                            value = e;
                        }
                        status = -1;
                        execCallbacks();
                    });
                    return this;
                }
                return {
                    promise: _promise,
                    resolve: _resolve,
                    fulfill: _resolve,
                    reject: _reject
                };
            };
            defer.deferred = defer.defer = defer;
            defer.nextTick = nextTick;
            defer.alwaysAsync = true;
            defer.onlyFuncs = true;
            defer.resolved = defer.fulfilled = function(value) {
                return defer(true).resolve(value).promise;
            };
            defer.rejected = function(reason) {
                return defer(true).reject(reason).promise;
            };
            defer.wait = function(time) {
                var d = defer();
                setTimeout(d.resolve, time || 0);
                return d.promise;
            };
            defer.delay = function(fn, delay) {
                var d = defer();
                setTimeout(function() {
                    try {
                        d.resolve(fn.apply(null));
                    } catch (e) {
                        d.reject(e);
                    }
                }, delay || 0);
                return d.promise;
            };
            defer.promisify = function(promise) {
                if (promise && isFunc(promise.then)) {
                    return promise;
                }
                return defer.resolved(promise);
            };
            function multiPromiseResolver(callerArguments, returnPromises) {
                var promises = slice(callerArguments);
                if (promises.length === 1 && isArray(promises[0])) {
                    if (!promises[0].length) {
                        return defer.fulfilled([]);
                    }
                    promises = promises[0];
                }
                var args = [], d = defer(), c = promises.length;
                if (!c) {
                    d.resolve(args);
                } else {
                    var resolver = function(i) {
                        promises[i] = defer.promisify(promises[i]);
                        promises[i].then(function(v) {
                            if (!(i in args)) {
                                args[i] = returnPromises ? promises[i] : v;
                                --c || d.resolve(args);
                            }
                        }, function(e) {
                            if (!(i in args)) {
                                if (!returnPromises) {
                                    d.reject(e);
                                } else {
                                    args[i] = promises[i];
                                    --c || d.resolve(args);
                                }
                            }
                        });
                    };
                    for (var i = 0, l = c; i < l; i++) {
                        resolver(i);
                    }
                }
                return d.promise;
            }
            defer.all = function() {
                return multiPromiseResolver(arguments, false);
            };
            defer.resolveAll = function() {
                return multiPromiseResolver(arguments, true);
            };
            defer.nodeCapsule = function(subject, fn) {
                if (!fn) {
                    fn = subject;
                    subject = void 0;
                }
                return function() {
                    var d = defer(), args = slice(arguments);
                    args.push(function(err, res) {
                        err ? d.reject(err) : d.resolve(arguments.length > 2 ? slice(arguments, 1) : res);
                    });
                    try {
                        fn.apply(subject, args);
                    } catch (e) {
                        d.reject(e);
                    }
                    return d.promise;
                };
            };
            return defer;
        }();
        return defer;
    });
    //! src/utils/async/dispatcher.js
    define("dispatcher", function() {
        var dispatcher = function(target, scope, map) {
            var listeners = {};
            function off(event, callback) {
                var index, list;
                list = listeners[event];
                if (list) {
                    if (callback) {
                        index = list.indexOf(callback);
                        if (index !== -1) {
                            list.splice(index, 1);
                        }
                    } else {
                        list.length = 0;
                    }
                }
            }
            function on(event, callback) {
                listeners[event] = listeners[event] || [];
                listeners[event].push(callback);
                return function() {
                    off(event, callback);
                };
            }
            function once(event, callback) {
                function fn() {
                    off(event, fn);
                    callback.apply(scope || target, arguments);
                }
                return on(event, fn);
            }
            function getListeners(event) {
                return listeners[event];
            }
            function fire(callback, args) {
                return callback && callback.apply(target, args);
            }
            function dispatch(event) {
                if (listeners[event]) {
                    var i = 0, list = listeners[event], len = list.length;
                    while (i < len) {
                        fire(list[i], arguments);
                        i += 1;
                    }
                }
                if (listeners.all && event !== "all") {
                    dispatch("all");
                }
            }
            if (scope && map) {
                target.on = scope[map.on] && scope[map.on].bind(scope);
                target.off = scope[map.off] && scope[map.off].bind(scope);
                target.once = scope[map.once] && scope[map.once].bind(scope);
                target.dispatch = target.fire = scope[map.dispatch].bind(scope);
            } else {
                target.on = on;
                target.off = off;
                target.once = once;
                target.dispatch = target.fire = dispatch;
            }
            target.getListeners = getListeners;
        };
        return dispatcher;
    });
    //! src/utils/async/throttle.js
    define("throttle", function() {
        var throttle = function(func, threshhold, scope) {
            threshhold = threshhold || 250;
            var last, deferTimer;
            return function() {
                var context = scope || this;
                var now = +new Date(), args = arguments;
                if (last && now < last + threshhold) {
                    clearTimeout(deferTimer);
                    deferTimer = setTimeout(function() {
                        last = now;
                        func.apply(context, args);
                    }, threshhold);
                } else {
                    last = now;
                    func.apply(context, args);
                }
            };
        };
        return throttle;
    });
    //! src/utils/async/waterfall.js
    define("waterfall", [ "toArray" ], function(toArray) {
        var waterfall = function(args, callbacks, resultHandler) {
            function callback() {
                if (callbacks.length) {
                    var cb = callbacks.shift();
                    cb.apply(null, toArray(arguments).concat(callback));
                } else {
                    var args = toArray(arguments);
                    args.unshift(null);
                    if (resultHandler) {
                        resultHandler.apply(null, args);
                    }
                }
            }
            args = args || [];
            callback.apply(null, args.concat(callback));
        };
        return waterfall;
    });
    //! src/utils/formatters/toArray.js
    define("toArray", [ "isArguments", "isArray", "isUndefined" ], function(isArguments, isArray, isUndefined) {
        var toArray = function(value) {
            if (isArguments(value)) {
                return Array.prototype.slice.call(value, 0) || [];
            }
            try {
                if (isArray(value)) {
                    return value;
                }
                if (!isUndefined(value)) {
                    return [].concat(value);
                }
            } catch (e) {}
            return [];
        };
        return toArray;
    });
    //! src/utils/validators/isArguments.js
    define("isArguments", function(toString) {
        var isArguments = function(value) {
            var str = String(value);
            var isArguments = str === "[object Arguments]";
            if (!isArguments) {
                isArguments = str !== "[object Array]" && value !== null && typeof value === "object" && typeof value.length === "number" && value.length >= 0 && toString.call(value.callee) === "[object Function]";
            }
            return isArguments;
        };
        return isArguments;
    });
    //! src/utils/validators/isArray.js
    define("isArray", function() {
        Array.prototype.__isArray = true;
        Object.defineProperty(Array.prototype, "__isArray", {
            enumerable: false,
            writable: true
        });
        var isArray = function(val) {
            return val ? !!val.__isArray : false;
        };
        return isArray;
    });
    //! src/utils/validators/isUndefined.js
    define("isUndefined", function() {
        var isUndefined = function(val) {
            return typeof val === "undefined";
        };
        return isUndefined;
    });
    //! src/utils/browser/cookie.js
    define("cookie", function() {
        var cookie = function() {
            var cookie = function() {
                return cookie.get.apply(cookie, arguments);
            };
            var utils = cookie.utils = {
                isArray: Array.isArray || function(value) {
                    return Object.prototype.toString.call(value) === "[object Array]";
                },
                isPlainObject: function(value) {
                    return !!value && Object.prototype.toString.call(value) === "[object Object]";
                },
                toArray: function(value) {
                    return Array.prototype.slice.call(value);
                },
                getKeys: Object.keys || function(obj) {
                    var keys = [], key = "";
                    for (key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            keys.push(key);
                        }
                    }
                    return keys;
                },
                escape: function(value) {
                    return String(value).replace(/[,;"\\=\s%]/g, function(character) {
                        return encodeURIComponent(character);
                    });
                },
                retrieve: function(value, fallback) {
                    return value === null ? fallback : value;
                }
            };
            cookie.defaults = {};
            cookie.expiresMultiplier = 60 * 60 * 24;
            cookie.set = function(key, value, options) {
                if (utils.isPlainObject(key)) {
                    for (var k in key) {
                        if (key.hasOwnProperty(k)) {
                            this.set(k, key[k], value);
                        }
                    }
                } else {
                    options = utils.isPlainObject(options) ? options : {
                        expires: options
                    };
                    var expires = options.expires !== undefined ? options.expires : this.defaults.expires || "", expiresType = typeof expires;
                    if (expiresType === "string" && expires !== "") {
                        expires = new Date(expires);
                    } else if (expiresType === "number") {
                        expires = new Date(+new Date() + 1e3 * this.expiresMultiplier * expires);
                    }
                    if (expires !== "" && "toGMTString" in expires) {
                        expires = ";expires=" + expires.toGMTString();
                    }
                    var path = options.path || this.defaults.path;
                    path = path ? ";path=" + path : "";
                    var domain = options.domain || this.defaults.domain;
                    domain = domain ? ";domain=" + domain : "";
                    var secure = options.secure || this.defaults.secure ? ";secure" : "";
                    document.cookie = utils.escape(key) + "=" + utils.escape(value) + expires + path + domain + secure;
                }
                return this;
            };
            cookie.remove = function(keys) {
                keys = utils.isArray(keys) ? keys : utils.toArray(arguments);
                for (var i = 0, l = keys.length; i < l; i++) {
                    this.set(keys[i], "", -1);
                }
                return this;
            };
            cookie.empty = function() {
                return this.remove(utils.getKeys(this.all()));
            };
            cookie.get = function(keys, fallback) {
                fallback = fallback || undefined;
                var cookies = this.all();
                if (utils.isArray(keys)) {
                    var result = {};
                    for (var i = 0, l = keys.length; i < l; i++) {
                        var value = keys[i];
                        result[value] = utils.retrieve(cookies[value], fallback);
                    }
                    return result;
                } else {
                    return utils.retrieve(cookies[keys], fallback);
                }
            };
            cookie.all = function() {
                if (document.cookie === "") {
                    return {};
                }
                var cookies = document.cookie.split("; "), result = {};
                for (var i = 0, l = cookies.length; i < l; i++) {
                    var item = cookies[i].split("=");
                    result[decodeURIComponent(item[0])] = decodeURIComponent(item[1]);
                }
                return result;
            };
            cookie.enabled = function() {
                if (navigator.cookieEnabled) {
                    return true;
                }
                var ret = cookie.set("_", "_").get("_") === "_";
                cookie.remove("_");
                return ret;
            };
            return cookie;
        }();
        return cookie;
    });
    //! src/utils/browser/localStorage.js
    define("localStorage", [ "dispatcher" ], function(dispatcher) {
        var localStorage = function() {
            var api = {
                events: {
                    WARNING: "localStorage:warning",
                    ERROR: "localStorage:error"
                },
                UNSUPPORTED: "LOCAL_STORAGE_NOT_SUPPORTED"
            }, pfx = "global", prefix = pfx + ":";
            function browserSupportsLocalStorage() {
                try {
                    return "localStorage" in window && window.localStorage !== null;
                } catch (e) {
                    api.dispatch(api.events.ERROR, e.Description);
                    return false;
                }
            }
            function localStorageEnabled() {
                try {
                    var has = browserSupportsLocalStorage(), key = "__localStorageSupportTest__", r;
                    if (has) {
                        r = Date.now().toString();
                        localStorage.setItem(key, r);
                        return localStorage.getItem(key) === r;
                    }
                } catch (e) {
                    api.dispatch(api.events.ERROR, e.Description);
                    return false;
                }
            }
            function addToLocalStorage(key, value) {
                if (!browserSupportsLocalStorage()) {
                    api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                    return false;
                }
                if (!value && value !== 0 && value !== "") return false;
                try {
                    localStorage.setItem(prefix + key, JSON.stringify(value));
                } catch (e) {
                    api.dispatch(api.events.ERROR, e.Description);
                    return false;
                }
                return true;
            }
            function getFromLocalStorage(key) {
                if (!browserSupportsLocalStorage()) {
                    api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                    return false;
                }
                var item = localStorage.getItem(prefix + key);
                if (!item) return null;
                return JSON.parse(item);
            }
            function removeFromLocalStorage(key) {
                if (!browserSupportsLocalStorage()) {
                    api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                    return false;
                }
                try {
                    localStorage.removeItem(prefix + key);
                } catch (e) {
                    api.dispatch(api.events.ERROR, e.Description);
                    return false;
                }
                return true;
            }
            function getAllFromLocalStorageByPrefix(localPrefix) {
                if (!browserSupportsLocalStorage()) {
                    api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                    return false;
                }
                var prefixKey = prefix + (localPrefix || ""), prefixKeyLength = prefixKey.length, prefixLength = prefix.length, localKey, result = {};
                for (var key in localStorage) {
                    if (localStorage.hasOwnProperty(key) && key.substr(0, prefixKeyLength) === prefixKey) {
                        localKey = key.substr(prefixLength);
                        result[localKey] = getFromLocalStorage(localKey);
                    }
                }
                return result;
            }
            function clearAllFromLocalStorage(pattern) {
                if (!browserSupportsLocalStorage()) {
                    api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                    return false;
                }
                var prefixLength = prefix.length;
                for (var key in localStorage) {
                    if (localStorage.hasOwnProperty(key) && key.substr(0, prefixLength) === prefix && (!pattern || key.substr(prefixLength).match(pattern))) {
                        try {
                            removeFromLocalStorage(key.substr(prefixLength));
                        } catch (e) {
                            api.dispatch(api.events.ERROR, e.Description);
                            return false;
                        }
                    }
                }
                return true;
            }
            api.prefix = function(value) {
                if (value !== undefined) {
                    pfx = value;
                    prefix = pfx + ":";
                }
                return pfx;
            };
            api.isSupported = browserSupportsLocalStorage;
            api.enabled = localStorageEnabled;
            api.put = addToLocalStorage;
            api.get = getFromLocalStorage;
            api.getAll = getAllFromLocalStorageByPrefix;
            api.remove = removeFromLocalStorage;
            api.clearAll = clearAllFromLocalStorage;
            dispatcher(api);
            return api;
        }();
        return localStorage;
    });
    //! src/utils/color/shades.js
    define("shades", function() {
        var shades = function(percents, rgbColors) {
            var i = 0, len = percents ? percents.length : 0, percentColors = [], defaultPercentColors = [ {
                pct: 0,
                color: {
                    r: 0,
                    g: 153,
                    b: 0
                }
            }, {
                pct: .5,
                color: {
                    r: 255,
                    g: 255,
                    b: 0
                }
            }, {
                pct: 1,
                color: {
                    r: 255,
                    g: 0,
                    b: 0
                }
            } ];
            if (percents && rgbColors) {
                while (i < len) {
                    percentColors.push(percents[i], rgbColors[i]);
                    i += 1;
                }
            } else if (percents) {
                percentColors = percents;
            } else {
                percentColors = defaultPercentColors;
            }
            function getRGB(pct) {
                var i = 0, len = percentColors.length, lower, upper, range, rangePct, pctLower, pctUpper, color, result;
                if (pct >= 1) {
                    i = len;
                }
                while (i < len) {
                    if (pct <= percentColors[i].pct) {
                        lower = i === 0 ? percentColors[i] : percentColors[i - 1];
                        upper = i === 0 ? percentColors[i + 1] : percentColors[i];
                        range = upper.pct - lower.pct;
                        rangePct = (pct - lower.pct) / range;
                        pctLower = 1 - rangePct;
                        pctUpper = rangePct;
                        color = {
                            r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
                            g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
                            b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
                        };
                        return color;
                    }
                    i += 1;
                }
                color = percentColors[percentColors.length - 1].color;
                return color;
            }
            function convertRGBToStr(rgb) {
                return "rgb(" + [ rgb.r, rgb.g, rgb.b ].join(",") + ")";
            }
            function getRGBStr(percent) {
                var rgb = getRGB(percent);
                return convertRGBToStr(rgb);
            }
            return {
                getRGB: getRGB,
                getRGBStr: getRGBStr,
                convertRGBToStr: convertRGBToStr
            };
        };
        return shades;
    });
    //! src/utils/crypt/keygen.js
    define("keygen", function() {
        var keygen = function(pattern) {
            var defaultPattern = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";
            return (pattern || defaultPattern).replace(/[xy]/g, function(b) {
                var d = 16 * Math.random() | 0;
                return ("x" == b ? d : d & 3 | 8).toString(16);
            });
        };
        return keygen;
    });
    //! src/utils/crypt/md5.js
    define("md5", function() {
        var md5 = function() {
            function safe_add(x, y) {
                var lsw = (x & 65535) + (y & 65535), msw = (x >> 16) + (y >> 16) + (lsw >> 16);
                return msw << 16 | lsw & 65535;
            }
            function bit_rol(num, cnt) {
                return num << cnt | num >>> 32 - cnt;
            }
            function md5_cmn(q, a, b, x, s, t) {
                return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
            }
            function md5_ff(a, b, c, d, x, s, t) {
                return md5_cmn(b & c | ~b & d, a, b, x, s, t);
            }
            function md5_gg(a, b, c, d, x, s, t) {
                return md5_cmn(b & d | c & ~d, a, b, x, s, t);
            }
            function md5_hh(a, b, c, d, x, s, t) {
                return md5_cmn(b ^ c ^ d, a, b, x, s, t);
            }
            function md5_ii(a, b, c, d, x, s, t) {
                return md5_cmn(c ^ (b | ~d), a, b, x, s, t);
            }
            function binl_md5(x, len) {
                x[len >> 5] |= 128 << len % 32;
                x[(len + 64 >>> 9 << 4) + 14] = len;
                var i, olda, oldb, oldc, oldd, a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
                for (i = 0; i < x.length; i += 16) {
                    olda = a;
                    oldb = b;
                    oldc = c;
                    oldd = d;
                    a = md5_ff(a, b, c, d, x[i], 7, -680876936);
                    d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
                    c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
                    b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
                    a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
                    d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
                    c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
                    b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
                    a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
                    d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
                    c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
                    b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
                    a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
                    d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
                    c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
                    b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);
                    a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
                    d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
                    c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
                    b = md5_gg(b, c, d, a, x[i], 20, -373897302);
                    a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
                    d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
                    c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
                    b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
                    a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
                    d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
                    c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
                    b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
                    a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
                    d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
                    c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
                    b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);
                    a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
                    d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
                    c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
                    b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
                    a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
                    d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
                    c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
                    b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
                    a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
                    d = md5_hh(d, a, b, c, x[i], 11, -358537222);
                    c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
                    b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
                    a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
                    d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
                    c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
                    b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);
                    a = md5_ii(a, b, c, d, x[i], 6, -198630844);
                    d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
                    c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
                    b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
                    a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
                    d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
                    c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
                    b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
                    a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
                    d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
                    c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
                    b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
                    a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
                    d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
                    c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
                    b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);
                    a = safe_add(a, olda);
                    b = safe_add(b, oldb);
                    c = safe_add(c, oldc);
                    d = safe_add(d, oldd);
                }
                return [ a, b, c, d ];
            }
            function binl2rstr(input) {
                var i, output = "";
                for (i = 0; i < input.length * 32; i += 8) {
                    output += String.fromCharCode(input[i >> 5] >>> i % 32 & 255);
                }
                return output;
            }
            function rstr2binl(input) {
                var i, output = [];
                output[(input.length >> 2) - 1] = undefined;
                for (i = 0; i < output.length; i += 1) {
                    output[i] = 0;
                }
                for (i = 0; i < input.length * 8; i += 8) {
                    output[i >> 5] |= (input.charCodeAt(i / 8) & 255) << i % 32;
                }
                return output;
            }
            function rstr_md5(s) {
                return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
            }
            function rstr_hmac_md5(key, data) {
                var i, bkey = rstr2binl(key), ipad = [], opad = [], hash;
                ipad[15] = opad[15] = undefined;
                if (bkey.length > 16) {
                    bkey = binl_md5(bkey, key.length * 8);
                }
                for (i = 0; i < 16; i += 1) {
                    ipad[i] = bkey[i] ^ 909522486;
                    opad[i] = bkey[i] ^ 1549556828;
                }
                hash = binl_md5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
                return binl2rstr(binl_md5(opad.concat(hash), 512 + 128));
            }
            function rstr2hex(input) {
                var hex_tab = "0123456789abcdef", output = "", x, i;
                for (i = 0; i < input.length; i += 1) {
                    x = input.charCodeAt(i);
                    output += hex_tab.charAt(x >>> 4 & 15) + hex_tab.charAt(x & 15);
                }
                return output;
            }
            function str2rstr_utf8(input) {
                return unescape(encodeURIComponent(input));
            }
            function raw_md5(s) {
                return rstr_md5(str2rstr_utf8(s));
            }
            function hex_md5(s) {
                return rstr2hex(raw_md5(s));
            }
            function raw_hmac_md5(k, d) {
                return rstr_hmac_md5(str2rstr_utf8(k), str2rstr_utf8(d));
            }
            function hex_hmac_md5(k, d) {
                return rstr2hex(raw_hmac_md5(k, d));
            }
            function md5(string, key, raw) {
                if (!key) {
                    if (!raw) {
                        return hex_md5(string);
                    }
                    return raw_md5(string);
                }
                if (!raw) {
                    return hex_hmac_md5(key, string);
                }
                return raw_hmac_md5(key, string);
            }
            return md5;
        }();
        return md5;
    });
    //! src/utils/data/cache.js
    define("cache", function() {
        var cache = function() {
            var Cache, ns;
            ns = {};
            Cache = function() {
                var _cachedItems = [];
                this.set = function(key, value) {
                    _cachedItems[key] = value;
                    return value;
                };
                this.get = function(key, defaultValue) {
                    if (_cachedItems.hasOwnProperty(key)) {
                        return _cachedItems[key];
                    }
                    return defaultValue;
                };
                this.getCopy = function(key, defaultValue, overwrite) {
                    var data = this.get(key, defaultValue, overwrite);
                    return data.copy(data);
                };
                this.merge = function(key, value) {
                    if (_cachedItems[key]) {
                        _cachedItems[key] = extend(_cachedItems[key], value);
                    } else {
                        _cachedItems[key] = value;
                    }
                    return _cachedItems[key];
                };
                this.keys = function() {
                    var keys = [];
                    for (var key in _cachedItems) {
                        if (_cachedItems.hasOwnProperty(key)) {
                            keys.push(key);
                        }
                    }
                    return keys;
                };
                this.all = function() {
                    return _cachedItems;
                };
                this.has = function(key) {
                    return _cachedItems.hasOwnProperty(key);
                };
                this.remove = function(key) {
                    delete _cachedItems[key];
                };
                this.clear = function() {
                    _cachedItems = {};
                };
                this.inc = function(key) {
                    var id = key + "Counter";
                    if (!_cachedItems[id]) {
                        _cachedItems[id] = 0;
                    }
                    _cachedItems[id] += 1;
                    return _cachedItems[id];
                };
                this.dec = function(key) {
                    var id = key + "Counter";
                    if (!_cachedItems[id]) {
                        _cachedItems[id] = 0;
                    }
                    _cachedItems[id] -= 1;
                    return _cachedItems[id];
                };
            };
            return function(name) {
                name = name || "__default__";
                if (!ns[name]) {
                    ns[name] = new Cache();
                }
                return ns[name];
            };
        }();
        return cache;
    });
    //! src/utils/data/copy.js
    define("copy", [ "isWindow", "isArray", "isDate", "isRegExp", "isObject" ], function(isWindow, isArray, isDate, isRegExp, isObject) {
        var copy = function(source, destination, stackSource, stackDest) {
            if (isWindow(source)) {
                throw Error("Can't copy! Making copies of Window instances is not supported.");
            }
            if (!destination) {
                destination = source;
                if (source) {
                    if (isArray(source)) {
                        destination = data.copy(source, [], stackSource, stackDest);
                    } else if (isDate(source)) {
                        destination = new Date(source.getTime());
                    } else if (isRegExp(source)) {
                        destination = new RegExp(source.source);
                    } else if (isObject(source)) {
                        destination = data.copy(source, {}, stackSource, stackDest);
                    }
                }
            } else {
                if (source === destination) {
                    throw Error("Can't copy! Source and destination are identical.");
                }
                stackSource = stackSource || [];
                stackDest = stackDest || [];
                if (isObject(source)) {
                    var index = stackSource.indexOf(source);
                    if (index !== -1) {
                        return stackDest[index];
                    }
                    stackSource.push(source);
                    stackDest.push(destination);
                }
                var result;
                if (isArray(source)) {
                    destination.length = 0;
                    for (var i = 0; i < source.length; i++) {
                        result = data.copy(source[i], null, stackSource, stackDest);
                        if (isObject(source[i])) {
                            stackSource.push(source[i]);
                            stackDest.push(result);
                        }
                        destination.push(result);
                    }
                } else {
                    forEach(destination, function(value, key) {
                        delete destination[key];
                    });
                    for (var key in source) {
                        result = data.copy(source[key], null, stackSource, stackDest);
                        if (isObject(source[key])) {
                            stackSource.push(source[key]);
                            stackDest.push(result);
                        }
                        destination[key] = result;
                    }
                }
            }
            return destination;
        };
        return copy;
    });
    //! src/utils/validators/isWindow.js
    define("isWindow", function() {
        var isWindow = function(obj) {
            return obj && obj.document && obj.location && obj.alert && obj.setInterval;
        };
        return isWindow;
    });
    //! src/utils/validators/isDate.js
    define("isDate", function() {
        var isDate = function(val) {
            return val instanceof Date;
        };
        return isDate;
    });
    //! src/utils/validators/isRegExp.js
    define("isRegExp", [ "toString" ], function() {
        var isRegExp = function(value) {
            return toString.call(value) === "[object RegExp]";
        };
        return isRegExp;
    });
    //! src/utils/validators/isObject.js
    define("isObject", function() {
        var isObject = function(val) {
            return val !== null && typeof val === "object";
        };
        return isObject;
    });
    //! src/utils/data/diff.js
    define("diff", [ "isDate", "isObject", "isEmpty", "isArray" ], function(isDate, isObject, isEmpty, isArray) {
        var diff = function(source, target) {
            var returnVal = {}, dateStr;
            for (var name in target) {
                if (name in source) {
                    if (isDate(target[name])) {
                        dateStr = isDate(source[name]) ? source[name].toISOString() : source[name];
                        if (target[name].toISOString() !== dateStr) {
                            returnVal[name] = target[name];
                        }
                    } else if (isObject(target[name]) && !isArray(target[name])) {
                        var result = diff(source[name], target[name]);
                        if (!isEmpty(result)) {
                            returnVal[name] = result;
                        }
                    } else if (!isEqual(source[name], target[name])) {
                        returnVal[name] = target[name];
                    }
                } else {
                    returnVal[name] = target[name];
                }
            }
            if (isEmpty(returnVal)) {
                return null;
            }
            return returnVal;
        };
        return diff;
    });
    //! src/utils/validators/isEmpty.js
    define("isEmpty", [ "isString", "isArray", "isObject" ], function(isString, isArray, isObject) {
        var isEmpty = function(val) {
            if (val === null) {
                return true;
            }
            if (isString(val)) {
                return val === "";
            }
            if (isArray(val)) {
                return val.length === 0;
            }
            if (isObject(val)) {
                for (var e in val) {
                    return false;
                }
                return true;
            }
            return false;
        };
        return isEmpty;
    });
    //! src/utils/validators/isString.js
    define("isString", function() {
        var isString = function(val) {
            return typeof val === "string";
        };
        return isString;
    });
    //! src/utils/data/extend.js
    define("extend", [ "toArray" ], function(toArray) {
        var extend = function(target, source) {
            var args = toArray(arguments), i = 1, len = args.length, item, j;
            var options = this || {};
            while (i < len) {
                item = args[i];
                for (j in item) {
                    if (item.hasOwnProperty(j)) {
                        if (target[j] && typeof target[j] === "object" && !item[j] instanceof Array) {
                            target[j] = extend.apply(options, [ target[j], item[j] ]);
                        } else if (item[j] instanceof Array) {
                            target[j] = target[j] || (options && options.arrayAsObject ? {
                                length: item[j].length
                            } : []);
                            if (item[j].length) {
                                target[j] = extend.apply(options, [ target[j], item[j] ]);
                            }
                        } else if (item[j] && typeof item[j] === "object") {
                            if (options.objectsAsArray && typeof item[j].length === "number") {
                                if (!(target[j] instanceof Array)) {
                                    target[j] = [];
                                }
                            }
                            target[j] = extend.apply(options, [ target[j] || {}, item[j] ]);
                        } else {
                            target[j] = item[j];
                        }
                    }
                }
                i += 1;
            }
            return target;
        };
        return extend;
    });
    //! src/utils/data/filter.js
    define("filter", function() {
        var filter = function(list, method) {
            var i = 0, len, result = [], extraArgs, response;
            if (arguments.length > 2) {
                extraArgs = Array.prototype.slice.apply(arguments);
                extraArgs.splice(0, 2);
            }
            if (list && list.length) {
                len = list.length;
                while (i < len) {
                    response = method.apply(null, [ list[i], i, list ].concat(extraArgs));
                    if (response) {
                        result.push(list[i]);
                    }
                    i += 1;
                }
            } else {
                for (i in list) {
                    if (list.hasOwnProperty(i)) {
                        response = method.apply(null, [ list[i], i, list ].concat(extraArgs));
                        if (response) {
                            result.push(list[i]);
                        }
                    }
                }
            }
            return result;
        };
        return filter;
    });
    //! src/utils/data/memory.js
    define("memory", function() {
        var memory = {
            getSize: function(obj) {
                return this.getBytesSize(this.sizeOfObject(obj));
            },
            sizeOfObject: function(value, level) {
                if (level == undefined) level = 0;
                var bytes = 0, i;
                if (value === null || value === undefined) {
                    bytes = 0;
                } else if (typeof value === "boolean") {
                    bytes = 4;
                } else if (typeof value === "string") {
                    bytes = value.length * 2;
                } else if (typeof value === "number") {
                    bytes = 8;
                } else if (typeof value === "object") {
                    if (value["__visited__"]) return 0;
                    value["__visited__"] = 1;
                    for (i in value) {
                        if (value.hasOwnProperty(i)) {
                            bytes += i.length * 2;
                            bytes += 8;
                            bytes += this.sizeOfObject(value[i], 1);
                        }
                    }
                }
                if (level == 0) {
                    this._clearReferenceTo(value);
                }
                return bytes;
            },
            _clearReferenceTo: function(value) {
                if (value && typeof value == "object") {
                    delete value["__visited__"];
                    for (var i in value) {
                        this._clearReferenceTo(value[i]);
                    }
                }
            },
            getBytesSize: function(bytes) {
                if (bytes > 1024 && bytes < 1024 * 1024) {
                    return (bytes / 1024).toFixed(2) + "K";
                } else if (bytes > 1024 * 1024 && bytes < 1024 * 1024 * 1024) {
                    return (bytes / (1024 * 1024)).toFixed(2) + "M";
                } else if (bytes > 1024 * 1024 * 1024) {
                    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + "G";
                }
                return bytes.toString();
            }
        };
        return memory;
    });
    //! src/utils/data/shallowCopy.js
    define("shallowCopy", [ "isArray", "isObject" ], function(isArray, isObject) {
        var shallowCopy = function(src, dest, ignorePrefix) {
            if (isArray(src)) {
                dest = dest || [];
                for (var i = 0; i < src.length; i++) {
                    dest[i] = src[i];
                }
            } else if (isObject(src)) {
                dest = dest || {};
                for (var key in src) {
                    if (src.hasOwnProperty(key) && !(key.charAt(0) === ignorePrefix && key.charAt(1) === ignorePrefix)) {
                        dest[key] = src[key];
                    }
                }
            }
            return dest || src;
        };
        return shallowCopy;
    });
    //! src/utils/data/size.js
    define("size", [ "isArray", "isString", "isObject" ], function(isArray, isString, isObject) {
        var size = function(obj, ownPropsOnly) {
            var count = 0, key;
            if (isArray(obj) || isString(obj)) {
                return obj.length;
            } else if (isObject(obj)) {
                for (key in obj) {
                    if (!ownPropsOnly || obj.hasOwnProperty(key)) {
                        count++;
                    }
                }
            }
            return count;
        };
        return size;
    });
    //! src/utils/display/align.js
    internal("align", function() {
        var sorting;
        var AdjacentBottomAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var bottomEdge = bounds.bottom();
                var length = targets.length;
                while (length--) {
                    targets[length].y(bottomEdge);
                }
            };
        };
        var AdjacentBottomLeftAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var bottomEdge = bounds.bottom();
                var leftEdge = bounds.left();
                var length = targets.length;
                while (length--) {
                    var target = targets[length];
                    target.x(leftEdge - target.width());
                    target.y(bottomEdge);
                }
            };
        };
        var AdjacentBottomRightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var bottomEdge = bounds.bottom();
                var rightEdge = bounds.right();
                var length = targets.length;
                while (length--) {
                    var item = targets[length];
                    item.x(rightEdge);
                    item.y(bottomEdge);
                }
            };
        };
        var AdjacentHorizontalLeftAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var centerX = bounds.left() + bounds.width() * .5;
                var length = targets.length;
                while (length--) {
                    targets[length].x(centerX - targets[length].width());
                }
            };
        };
        var AdjacentHorizontalRightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var centerX = bounds.left() + bounds.width() * .5;
                var length = targets.length;
                while (length--) {
                    targets[length].x(centerX);
                }
            };
        };
        var AdjacentLeftAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var leftEdge = bounds.left();
                var length = targets.length;
                while (length--) {
                    targets[length].x(leftEdge - targets[length].width());
                }
            };
        };
        var AdjacentRightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var rightEdge = bounds.right();
                var length = targets.length;
                while (length--) {
                    targets[length].x(rightEdge);
                }
            };
        };
        var AdjacentTopAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var topEdge = bounds.top();
                var length = targets.length;
                while (length--) {
                    targets[length].y(topEdge - targets[length].height());
                }
            };
        };
        var AdjacentTopLeftAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var topEdge = bounds.top();
                var leftEdge = bounds.left();
                var length = targets.length;
                while (length--) {
                    var target = targets[length];
                    target.x(leftEdge - target.width());
                    target.y(topEdge - target.height());
                }
            };
        };
        var AdjacentTopRightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var topEdge = bounds.top();
                var rightEdge = bounds.right();
                var length = targets.length;
                while (length--) {
                    var target = targets[length];
                    target.x(rightEdge);
                    target.y(topEdge - target.height());
                }
            };
        };
        var AdjacentVerticalBottomAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var centerY = bounds.centerY();
                var length = targets.length;
                while (length--) {
                    targets[length].y(centerY);
                }
            };
        };
        var AdjacentVerticalTopAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var centerY = bounds.centerY();
                var length = targets.length;
                while (length--) {
                    targets[length].y(centerY - targets[length].height());
                }
            };
        };
        var BottomAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var bottomEdge = bounds.bottom();
                var length = targets.length;
                while (length--) {
                    targets[length].val("y", bottomEdge - targets[length].height);
                }
            };
        };
        var BottomLeftAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var bottomEdge = bounds.bottom();
                var leftEdge = bounds.left();
                var length = targets.length;
                while (length--) {
                    targets[length].x(leftEdge);
                    targets[length].y(bottomEdge - targets[length].height());
                }
            };
        };
        var BottomRightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var bottomEdge = bounds.bottom();
                var rightEdge = bounds.right();
                var length = targets.length;
                while (length--) {
                    var target = targets[length];
                    target.x(rightEdge - target.width());
                    target.y(bottomEdge - target.height());
                }
            };
        };
        var CenterAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var centerX = bounds.centerX();
                var centerY = bounds.centerY();
                var length = targets.length;
                while (length--) {
                    var target = targets[length];
                    target.x(centerX - target.width() * .5);
                    target.y(centerY - target.height() * .5);
                }
            };
        };
        var DistributeBottomAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                targets.sort(sorting.sortRectBottom);
                var length = targets.length;
                var first = bounds.top() + targets[0].bounds.height;
                var spread = (bounds.bottom() - first) / (length - 1);
                while (length--) {
                    targets[length].val("y", first - targets[length].bounds.height + spread * length);
                }
            };
        };
        var DistributeHorizontalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                targets = targets.sort(sorting.sortRectCenterX);
                var length = targets.length;
                var first = bounds.left() + targets[0].bounds.width * .5;
                var last = bounds.right() - targets[targets.length - 1].width * .5;
                var spread = (last - first) / (length - 1);
                while (length--) {
                    targets[length].val("x", first - targets[length].bounds.width * .5 + spread * length);
                }
            };
        };
        var DistributeLeftAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                targets = targets.sort(sorting.sortRectLeft);
                var leftEdge = bounds.left();
                var spread = (bounds.width - targets[targets.length - 1].bounds.width) / (targets.length - 1);
                var length = targets.length;
                while (length--) {
                    targets[length].val("x", leftEdge + spread * length);
                }
            };
        };
        var DistributeRightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                targets.sort(sorting.sortRectRight);
                var leftEdge = bounds.left();
                var first = leftEdge + targets[0].bounds.width;
                var spread = (bounds.right() - first) / (targets.length - 1);
                var length = targets.length;
                while (length--) {
                    targets[length].val("x", first - targets[length].bounds.width + spread * length);
                }
            };
        };
        var DistributeTopAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                targets = targets.sort(sorting.sortRectTop);
                var length = targets.length;
                var first = bounds.top();
                var spread = (bounds.bottom() - targets[length - 1].bounds.height - first) / (length - 1);
                while (length--) {
                    targets[length].val("y", first + spread * length);
                }
            };
        };
        var DistributeVerticalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                targets = targets.sort(sorting.sortRectCenterY);
                var length = targets.length;
                var first = bounds.top() + targets[0].bounds.height * .5;
                var last = bounds.bottom() - targets[length - 1].bounds.height * .5;
                var spread = (last - first) / (length - 1);
                while (length--) {
                    targets[length].val("y", first - targets[length].bounds.height * .5 + spread * length);
                }
            };
        };
        var HorizontalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var mid = bounds.left() + bounds.width * .5;
                var length = targets.length;
                while (length--) {
                    targets[length].val("x", mid - targets[length].bounds.width * .5);
                }
            };
        };
        var LeftAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var leftEdge = bounds.left();
                var length = targets.length;
                while (length--) {
                    targets[length].val("x", leftEdge);
                }
            };
        };
        var MatchHeightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var endH = bounds.height;
                var length = targets.length;
                while (length--) {
                    targets[length].val("height", endH);
                }
            };
        };
        var MatchSizeAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var endW = bounds.width;
                var endH = bounds.height;
                var length = targets.length;
                while (length--) {
                    targets[length].val("width", endW);
                    targets[length].val("height", endH);
                }
            };
        };
        var MatchWidthAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var endW = bounds.width;
                var length = targets.length;
                while (length--) {
                    targets[length].val("width", endW);
                }
            };
        };
        var RightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var rightEdge = bounds.right();
                var length = targets.length;
                while (length--) {
                    targets[length].val("x", rightEdge - targets[length].bounds.width);
                }
            };
        };
        var ScaleToFillAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var width = bounds.width();
                var height = bounds.height();
                var ratio = width / height;
                var length = targets.length;
                while (length--) {
                    var item = targets[length];
                    var itemWHRatio = item.width() / item.height();
                    var itemHWRatio = item.height() / item.width();
                    if (itemWHRatio > ratio) {
                        item.height(height);
                        item.width(height / itemHWRatio);
                    } else if (itemWHRatio < ratio) {
                        item.width(width);
                        item.height(width / itemWHRatio);
                    } else {
                        item.width(width);
                        item.height(height);
                    }
                }
            };
        };
        var ScaleToFitAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var width = bounds.width();
                var height = bounds.height();
                var ratio = width / height;
                var length = targets.length;
                while (length--) {
                    var item = targets[length];
                    var itemWHRatio = item.width() / item.height();
                    var itemHWRatio = item.height() / item.width();
                    if (itemWHRatio > ratio) {
                        item.width(width);
                        item.height(width / itemWHRatio);
                    } else if (itemWHRatio < ratio) {
                        item.height(height);
                        item.width(height / itemHWRatio);
                    } else {
                        item.width(width);
                        item.height(height);
                    }
                }
            };
        };
        var SpaceHorizontalAligner = function() {
            this.alignRectangles = function(bounds, targets, spread) {
                targets = targets.concat();
                targets = targets.sort(sorting.sortRectLeft);
                var objsWidth = 0;
                var totalWidth = bounds.width;
                var length = targets.length;
                while (length--) {
                    objsWidth += targets[length].bounds.width;
                }
                length = targets.length;
                spread = spread !== undefined ? spread : (totalWidth - objsWidth) / (length - 1);
                spread = Number(spread);
                var right = bounds.left() + targets[0].bounds.width;
                targets[0].val("x", bounds.left());
                for (var j = 1; j < length; j++) {
                    var item = targets[j];
                    item.val("x", right + spread);
                    right += item.bounds.width + spread;
                }
            };
        };
        var SpaceInsideHorizontalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                targets = targets.sort(sorting.sortRectLeft);
                var objsWidth = 0;
                var totalWidth = bounds.width();
                var length = targets.length;
                while (length--) {
                    objsWidth += targets[length].width();
                }
                var spread = (totalWidth - objsWidth) / (length + 1);
                var right = bounds.left();
                for (var j = 0; j < length; j++) {
                    var item = targets[j];
                    item.x(right + spread);
                    right += item.width() + spread;
                }
            };
        };
        var SpaceInsideVerticalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                targets = targets.sort(sorting.sortRectTop);
                var objsHeight = 0;
                var totalHeight = bounds.height();
                var length = targets.length;
                while (length--) {
                    objsHeight += targets[length].height();
                }
                var spread = (totalHeight - objsHeight) / (length + 1);
                var bottom = bounds.top();
                for (var j = 0; j < length; j++) {
                    var target = targets[j];
                    target.y(bottom + spread);
                    bottom += target.height() + spread;
                }
            };
        };
        var SpaceVerticalAligner = function() {
            this.alignRectangles = function(bounds, targets, spread) {
                targets = targets.concat();
                targets = targets.sort(sorting.sortRectTop);
                var targetTotalHeight = 0;
                var totalHeight = bounds.height;
                var length = targets.length;
                while (length--) {
                    targetTotalHeight += targets[length].bounds.height;
                }
                length = targets.length;
                spread = spread !== undefined ? spread : (totalHeight - targetTotalHeight) / (length - 1);
                var bottom = bounds.top() + targets[0].bounds.height;
                targets[0].val("y", bounds.top());
                for (var j = 1; j < length; j++) {
                    var item = targets[j];
                    item.val("y", bottom + spread);
                    bottom += item.bounds.height + spread;
                }
            };
        };
        var TopAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var topEdge = bounds.top();
                var length = targets.length;
                while (length--) {
                    targets[length].val("y", topEdge);
                }
            };
        };
        var TopLeftAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var topEdge = bounds.top();
                var leftEdge = bounds.left();
                var length = targets.length;
                while (length--) {
                    targets[length].y(topEdge);
                    targets[length].x(leftEdge);
                }
            };
        };
        var TopRightAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var topEdge = bounds.top();
                var rightEdge = bounds.right();
                var length = targets.length;
                while (length--) {
                    targets[length].x(rightEdge - targets[length].width());
                    targets[length].y(topEdge);
                }
            };
        };
        var VerticalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var centerY = bounds.centerY();
                var length = targets.length;
                while (length--) {
                    targets[length].val("y", centerY - targets[length].bounds.height * .5);
                }
            };
        };
        var StackHorizontalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                var before = [];
                var after = [];
                var left = 0;
                var right = 0;
                var item;
                var endX;
                var leftEdge = bounds.left();
                var rightEdge = bounds.right();
                var centerX = bounds.centerX();
                for (var i = 0; i < targets.length; i++) {
                    var target = targets[length];
                    var targetCenterX = target.centerX();
                    if (targetCenterX < centerX) {
                        before.push(targets[length]);
                    } else {
                        after.push(targets[length]);
                    }
                }
                before.sort(sorting.sortRectAdjacentRight);
                after.sort(sorting.sortRectAdjacentLeft);
                before.reverse();
                var firstTarget;
                if (before.length > 0) {
                    firstTarget = before[0];
                    endX = leftEdge - firstTarget.width;
                    left = leftEdge - firstTarget.width;
                    firstTarget.x(endX);
                    for (i = 1; i < before.length; i++) {
                        item = before[i];
                        endX = left - item.width;
                        left -= item.width;
                        item.x(endX);
                    }
                }
                if (after.length > 0) {
                    firstTarget = after[0];
                    endX = rightEdge;
                    right = rightEdge + firstTarget.width;
                    firstTarget.x(endX);
                    for (i = 1; i < after.length; i++) {
                        item = after[i];
                        endX = right;
                        right += item.width;
                        item.x(endX);
                    }
                }
            };
        };
        var StackVerticalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                targets = targets.concat();
                var above = [];
                var below = [];
                var centerY = bounds.centerY();
                for (var i = 0; i < targets.length; i++) {
                    var target = targets[length];
                    var targetCenterY = target.centerY();
                    if (targetCenterY < centerY) {
                        above.push(targets[length]);
                    } else {
                        below.push(targets[length]);
                    }
                }
                above.sort(sorting.sortRectAdjacentTop);
                below.sort(sorting.sortRectAdjacentBottom);
                above.reverse();
                var top = 0;
                var bottom = 0;
                var item;
                var endY;
                for (var j = 0; j < above.length; j++) {
                    item = above[j];
                    if (j !== 0) {
                        endY = top - item.height();
                        top -= item.height();
                    } else {
                        endY = bounds.top() - item.height();
                        top = bounds.top() - item.height();
                    }
                    item.y(endY);
                }
                for (var k = 0; k < below.length; k++) {
                    item = below[k];
                    if (k !== 0) {
                        endY = bottom;
                        bottom += item.height();
                    } else {
                        endY = bounds.bottom();
                        bottom = bounds.bottom();
                    }
                    item.y(endY);
                }
            };
        };
        var FlipHorizontalAligner = function() {
            this.alignRectangles = function(bounds, targets) {
                var leftEdge = bounds.left();
                var rightEdge = bounds.right();
                var length = targets.length;
                while (length--) {
                    targets[length].val("x", leftEdge + rightEdge - targets[length].bounds.x - targets[length].bounds.width);
                }
            };
        };
        var Align = function() {
            sorting = new dash.display.Sorting();
            this.left = new LeftAligner();
            this.horizontal = new HorizontalAligner();
            this.right = new RightAligner();
            this.top = new TopAligner();
            this.vertical = new VerticalAligner();
            this.bottom = new BottomAligner();
            this.center = new CenterAligner();
            this.topLeft = new TopLeftAligner();
            this.topRight = new TopRightAligner();
            this.bottomLeft = new BottomLeftAligner();
            this.bottomRight = new BottomRightAligner();
            this.adjacentLeft = new AdjacentLeftAligner();
            this.adjacentHorizontalLeft = new AdjacentHorizontalLeftAligner();
            this.adjacentHorizontalRight = new AdjacentHorizontalRightAligner();
            this.adjacentRight = new AdjacentRightAligner();
            this.adjacentTop = new AdjacentTopAligner();
            this.adjacentVerticalTop = new AdjacentVerticalTopAligner();
            this.adjacentVerticalBottom = new AdjacentVerticalBottomAligner();
            this.adjacentBottom = new AdjacentBottomAligner();
            this.adjacentTopLeft = new AdjacentTopLeftAligner();
            this.adjacentTopRight = new AdjacentTopRightAligner();
            this.adjacentBottomLeft = new AdjacentBottomLeftAligner();
            this.adjacentBottomRight = new AdjacentBottomRightAligner();
            this.distributeLeft = new DistributeLeftAligner();
            this.distributeHorizontal = new DistributeHorizontalAligner();
            this.distributeRight = new DistributeRightAligner();
            this.distributeTop = new DistributeTopAligner();
            this.distributeVertical = new DistributeVerticalAligner();
            this.distributeBottom = new DistributeBottomAligner();
            this.matchWidth = new MatchWidthAligner();
            this.matchHeight = new MatchHeightAligner();
            this.matchSize = new MatchSizeAligner();
            this.scaleToFit = new ScaleToFitAligner();
            this.scaleToFill = new ScaleToFillAligner();
            this.spaceHorizontal = new SpaceHorizontalAligner();
            this.spaceInsideHorizontal = new SpaceInsideHorizontalAligner();
            this.spaceVertical = new SpaceVerticalAligner();
            this.spaceInsideVertical = new SpaceInsideVerticalAligner();
            this.stackHorizontal = new StackHorizontalAligner();
            this.stackVertical = new StackVerticalAligner();
            this.flipHorizontal = new FlipHorizontalAligner();
        };
        return Align;
    });
    //! src/utils/display/display.js
    define("display", [ "align", "sorting" ], function(align, sorting) {
        return {
            align: function() {
                return new align();
            },
            sorting: function() {
                return new sorting();
            }
        };
    });
    //! src/utils/display/sorting.js
    internal("sorting", function() {
        var Sorting = function() {
            var that = this;
            that.compareNumber = function(a, b) {
                return a > b ? 1 : a < b ? -1 : 0;
            };
            that.sortRectWidth = function(a, b) {
                return that.compareNumber(a.bounds.width, b.bounds.width);
            };
            that.sortRectHeight = function(a, b) {
                return that.compareNumber(a.bounds.height, b.bounds.height);
            };
            that.sortRectLeft = function(a, b) {
                return that.compareNumber(a.bounds.left(), b.bounds.left());
            };
            that.sortRectRight = function(a, b) {
                return that.compareNumber(a.bounds.right(), b.bounds.right());
            };
            that.sortRectTop = function(a, b) {
                return that.compareNumber(a.bounds.top(), b.bounds.top());
            };
            that.sortRectBottom = function(a, b) {
                return that.compareNumber(a.bounds.bottom(), b.bounds.bottom());
            };
            that.sortRectCenterX = function(a, b) {
                return that.compareNumber(a.bounds.centerX(), b.bounds.centerX());
            };
            that.sortRectCenterY = function(a, b) {
                return that.compareNumber(a.bounds.centerY(), b.bounds.centerY());
            };
            that.sortRectAdjacentLeft = function(a, b) {
                var i = that.sortRectLeft(a, b);
                if (i === 0) {
                    i = that.sortRectRight(a, b);
                }
                return i;
            };
            that.sortRectAdjacentRight = function(a, b) {
                var i = that.sortRectRight(a, b);
                if (i === 0) {
                    i = that.sortRectLeft(a, b);
                }
                return i;
            };
            that.sortRectAdjacentTop = function(a, b) {
                var i = that.sortRectTop(a, b);
                if (i === 0) {
                    i = that.sortRectBottom(a, b);
                }
                return i;
            };
            that.sortRectAdjacentBottom = function(a, b) {
                var i = that.sortRectBottom(a, b);
                if (i === 0) {
                    i = that.sortRectTop(a, b);
                }
                return i;
            };
        };
        return Sorting;
    });
    //! src/utils/formatters/fromJson.js
    define("fromJson", function() {
        var fromJson = function(source, jsonObjectFormat) {
            if (typeof jsonObjectFormat === "undefined") {
                jsonObjectFormat = true;
            }
            var object_start = jsonObjectFormat ? "{" : "(";
            var object_end = jsonObjectFormat ? "}" : ")";
            var pair_seperator = jsonObjectFormat ? ":" : "=";
            var at = 0;
            var ch = " ";
            var escapee = {
                '"': '"',
                "\\": "\\",
                "/": "/",
                b: "\b",
                f: "\f",
                n: "\n",
                r: "\r",
                t: "	"
            };
            var text = source;
            var result = readValue();
            skipWhitespace();
            if (ch) {
                raiseError("Syntax error");
            }
            return result;
            function raiseError(m) {
                throw {
                    name: "SyntaxError",
                    message: m,
                    at: at,
                    text: text
                };
            }
            function next(c) {
                if (c && c !== ch) {
                    raiseError("Expected '" + c + "' instead of '" + ch + "'");
                }
                ch = text.charAt(at);
                at += 1;
                return ch;
            }
            function readString() {
                var s = "";
                if (ch === '"') {
                    while (next()) {
                        if (ch === '"') {
                            next();
                            return s;
                        }
                        if (ch === "\\") {
                            next();
                            if (ch === "u") {
                                var uffff = 0;
                                for (var i = 0; i < 4; i += 1) {
                                    var hex = parseInt(next(), 16);
                                    if (!isFinite(hex)) {
                                        break;
                                    }
                                    uffff = uffff * 16 + hex;
                                }
                                s += String.fromCharCode(uffff);
                            } else if (typeof escapee[ch] === "string") {
                                s += escapee[ch];
                            } else {
                                break;
                            }
                        } else {
                            s += ch;
                        }
                    }
                }
                raiseError("Bad string");
            }
            function skipWhitespace() {
                while (ch && ch <= " ") {
                    next();
                }
            }
            function readWord() {
                var s = "";
                while (allowedInWord()) {
                    s += ch;
                    next();
                }
                if (s === "true") {
                    return true;
                }
                if (s === "false") {
                    return false;
                }
                if (s === "null") {
                    return null;
                }
                if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(s)) {
                    return parseFloat(s);
                }
                return s;
            }
            function readArray() {
                var array = [];
                if (ch === "[") {
                    next("[");
                    skipWhitespace();
                    if (ch === "]") {
                        next("]");
                        return array;
                    }
                    while (ch) {
                        array.push(readValue());
                        skipWhitespace();
                        if (ch === "]") {
                            next("]");
                            return array;
                        }
                        next(",");
                        skipWhitespace();
                    }
                }
                raiseError("Bad array");
            }
            function readObject() {
                var o = {};
                if (ch === object_start) {
                    next(object_start);
                    skipWhitespace();
                    if (ch === object_end) {
                        next(object_end);
                        return o;
                    }
                    while (ch) {
                        var key = ch === '"' ? readString() : readWord();
                        if (typeof key !== "string") {
                            raiseError("Bad object key: " + key);
                        }
                        skipWhitespace();
                        next(pair_seperator);
                        if (Object.hasOwnProperty.call(o, key)) {
                            raiseError('Duplicate key: "' + key + '"');
                        }
                        o[key] = readValue();
                        skipWhitespace();
                        if (ch === object_end) {
                            next(object_end);
                            return o;
                        }
                        next(",");
                        skipWhitespace();
                    }
                }
                raiseError("Bad object");
            }
            function readValue() {
                skipWhitespace();
                switch (ch) {
                  case object_start:
                    return readObject();

                  case "[":
                    return readArray();

                  case '"':
                    return readString();

                  default:
                    return readWord();
                }
            }
            function allowedInWord() {
                switch (ch) {
                  case '"':
                  case "\\":
                  case "	":
                  case "\n":
                  case "\r":
                  case ",":
                  case "[":
                  case "]":
                  case object_start:
                  case object_end:
                  case pair_seperator:
                    return false;
                }
                return ch > " ";
            }
        };
        return fromJson;
    });
    //! src/utils/formatters/fromXML.js
    define("fromXML", function() {
        var strToXML = function(str) {
            var parser, xmlDoc;
            if (window.DOMParser) {
                parser = new DOMParser();
                xmlDoc = parser.parseFromString(str, "text/xml");
            } else {
                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = false;
                xmlDoc.loadXML(str);
            }
            return xmlDoc;
        };
        var fromXML = function(node) {
            if (typeof node === "string") {
                node = strToXML(node).firstElementChild;
            }
            var data = {};
            function convertValue(value) {
                if (isNaN(value)) {
                    if (value === "true") {
                        return true;
                    }
                    if (value === "false") {
                        return false;
                    }
                    return value;
                }
                return Number(value);
            }
            function setValue(key, value) {
                if (data[key]) {
                    if (data[key].constructor !== Array) {
                        data[key] = [ data[key] ];
                    }
                    data[key][data[key].length] = convertValue(value);
                } else {
                    data[key] = convertValue(value);
                }
            }
            function setText(key, value) {
                data[key].text = value;
            }
            var c, cn;
            if (node.attributes) {
                for (c = 0; node.attributes[c]; c++) {
                    cn = node.attributes[c];
                    setValue(cn.name, cn.value);
                }
            }
            if (node.childNodes) {
                for (c = 0; node.childNodes[c]; c++) {
                    cn = node.childNodes[c];
                    if (cn.nodeType === 1) {
                        if (cn.childNodes.length === 1 && cn.firstChild.nodeType === 3) {
                            if (cn.attributes.length) {
                                setValue(cn.nodeName, fromXML(cn));
                                setText(cn.nodeName, cn.firstChild.nodeValue);
                            } else {
                                setValue(cn.nodeName, cn.firstChild.nodeValue);
                            }
                        } else {
                            setValue(cn.nodeName, fromXML(cn));
                        }
                    }
                }
            }
            return data;
        };
        return fromXML;
    });
    //! src/utils/formatters/lpad.js
    define("lpad", function() {
        var lpad = function(char, len) {
            var s = "";
            while (s.length < len) {
                s += char;
            }
            return s;
        };
        return lpad;
    });
    //! src/utils/formatters/rpad.js
    define("rpad", function() {
        var rpad = function(char, len) {
            var s = "";
            while (s.length < len) {
                s += char;
            }
            return s;
        };
        return rpad;
    });
    //! src/utils/formatters/toDOM.js
    define("toDOM", function() {
        var htmlToDOM = function(htmlStr) {
            var container = document.createElement("div");
            container.innerHTML = htmlStr;
            return container.firstChild;
        };
        return htmlToDOM;
    });
    //! src/utils/formatters/toDateString.js
    define("toDateString", [ "isString", "isNumber", "isDate" ], function(isString, isNumber, isDate) {
        var slice = [].slice, push = [].push;
        var DATETIME_FORMATS = {
            MONTH: "January,February,March,April,May,June,July,August,September,October,November,December".split(","),
            SHORTMONTH: "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(","),
            DAY: "Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(","),
            SHORTDAY: "Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(","),
            AMPMS: [ "AM", "PM" ],
            medium: "MMM d, y h:mm:ss a",
            "short": "M/d/yy h:mm a",
            fullDate: "EEEE, MMMM d, y",
            longDate: "MMMM d, y",
            mediumDate: "MMM d, y",
            shortDate: "M/d/yy",
            mediumTime: "h:mm:ss a",
            shortTime: "h:mm a"
        };
        function int(val) {
            return parseInt(val, 10);
        }
        function uppercase(val) {
            return (val + "").toUpperCase();
        }
        function concat(array1, array2, index) {
            return array1.concat(slice.call(array2, index));
        }
        function padNumber(num, digits, trim) {
            var neg = "";
            if (num < 0) {
                neg = "-";
                num = -num;
            }
            num = "" + num;
            while (num.length < digits) {
                num = "0" + num;
            }
            if (trim) {
                num = num.substr(num.length - digits);
            }
            return neg + num;
        }
        function dateGetter(name, size, offset, trim) {
            offset = offset || 0;
            return function(date) {
                var value = date["get" + name]();
                if (offset > 0 || value > -offset) {
                    value += offset;
                }
                if (value === 0 && offset === -12) {
                    value = 12;
                }
                return padNumber(value, size, trim);
            };
        }
        function dateStrGetter(name, shortForm) {
            return function(date, formats) {
                var value = date["get" + name]();
                var get = uppercase(shortForm ? "SHORT" + name : name);
                return formats[get][value];
            };
        }
        function timeZoneGetter(date) {
            var zone = -1 * date.getTimezoneOffset();
            var paddedZone = zone >= 0 ? "+" : "";
            paddedZone += padNumber(Math[zone > 0 ? "floor" : "ceil"](zone / 60), 2) + padNumber(Math.abs(zone % 60), 2);
            return paddedZone;
        }
        function getFirstThursdayOfYear(year) {
            var dayOfWeekOnFirst = new Date(year, 0, 1).getDay();
            return new Date(year, 0, (dayOfWeekOnFirst <= 4 ? 5 : 12) - dayOfWeekOnFirst);
        }
        function getThursdayThisWeek(datetime) {
            return new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate() + (4 - datetime.getDay()));
        }
        function weekGetter(size) {
            return function(date) {
                var firstThurs = getFirstThursdayOfYear(date.getFullYear()), thisThurs = getThursdayThisWeek(date);
                var diff = +thisThurs - +firstThurs, result = 1 + Math.round(diff / 6048e5);
                return padNumber(result, size);
            };
        }
        function ampmGetter(date, formats) {
            return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1];
        }
        var DATE_FORMATS = {
            yyyy: dateGetter("FullYear", 4),
            yy: dateGetter("FullYear", 2, 0, true),
            y: dateGetter("FullYear", 1),
            MMMM: dateStrGetter("Month"),
            MMM: dateStrGetter("Month", true),
            MM: dateGetter("Month", 2, 1),
            M: dateGetter("Month", 1, 1),
            dd: dateGetter("Date", 2),
            d: dateGetter("Date", 1),
            HH: dateGetter("Hours", 2),
            H: dateGetter("Hours", 1),
            hh: dateGetter("Hours", 2, -12),
            h: dateGetter("Hours", 1, -12),
            mm: dateGetter("Minutes", 2),
            m: dateGetter("Minutes", 1),
            ss: dateGetter("Seconds", 2),
            s: dateGetter("Seconds", 1),
            sss: dateGetter("Milliseconds", 3),
            EEEE: dateStrGetter("Day"),
            EEE: dateStrGetter("Day", true),
            a: ampmGetter,
            Z: timeZoneGetter,
            ww: weekGetter(2),
            w: weekGetter(1)
        };
        var DATE_FORMATS_SPLIT = /((?:[^yMdHhmsaZEw']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z|w+))(.*)/, NUMBER_STRING = /^\-?\d+$/;
        var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/;
        function jsonStringToDate(string) {
            var match = string.match(R_ISO8601_STR);
            if (match) {
                var date = new Date(0), tzHour = 0, tzMin = 0, dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear, timeSetter = match[8] ? date.setUTCHours : date.setHours;
                if (match[9]) {
                    tzHour = int(match[9] + match[10]);
                    tzMin = int(match[9] + match[11]);
                }
                dateSetter.call(date, int(match[1]), int(match[2]) - 1, int(match[3]));
                var h = int(match[4] || 0) - tzHour;
                var m = int(match[5] || 0) - tzMin;
                var s = int(match[6] || 0);
                var ms = Math.round(parseFloat("0." + (match[7] || 0)) * 1e3);
                timeSetter.call(date, h, m, s, ms);
                return date;
            }
            return string;
        }
        var toDateString = function(date, format) {
            var text = "", parts = [], fn, match;
            format = format || "mediumDate";
            format = DATETIME_FORMATS[format] || format;
            if (isString(date)) {
                date = NUMBER_STRING.test(date) ? int(date) : jsonStringToDate(date);
            }
            if (isNumber(date)) {
                date = new Date(date);
            }
            if (!isDate(date)) {
                return date;
            }
            while (format) {
                match = DATE_FORMATS_SPLIT.exec(format);
                if (match) {
                    parts = concat(parts, match, 1);
                    format = parts.pop();
                } else {
                    parts.push(format);
                    format = null;
                }
            }
            forEach(parts, function(value) {
                fn = DATE_FORMATS[value];
                text += fn ? fn(date, DATETIME_FORMATS) : value.replace(/(^'|'$)/g, "").replace(/''/g, "'");
            });
            return text;
        };
        return toDateString;
    });
    //! src/utils/validators/isNumber.js
    define("isNumber", function() {
        var isNumber = function(val) {
            return typeof val === "number";
        };
        return isNumber;
    });
    //! src/utils/formatters/toObject.js
    define("toObject", [ "isUndefined", "isObject" ], function(isUndefined, isObject) {
        var toObject = function(value) {
            if (isUndefined(value)) {
                return {};
            }
            if (isObject(value)) {
                return value;
            }
            return {
                value: value
            };
        };
        return toObject;
    });
    //! src/utils/formatters/toString.js
    define("toString", function() {
        var toString = function() {
            var value = [];
            forEach(this, function(e) {
                value.push("" + e);
            });
            return "[" + value.join(", ") + "]";
        };
        return toString;
    });
    //! src/utils/formatters/toTimeAgo.js
    define("toTimeAgo", function() {
        var toTimeAgo = function(date) {
            var ago = " ago";
            var interval, seconds;
            seconds = Math.floor((new Date() - date) / 1e3);
            interval = Math.floor(seconds / 31536e3);
            if (interval >= 1) {
                return {
                    interval: interval,
                    ago: "y"
                };
            }
            interval = Math.floor(seconds / 2592e3);
            if (interval >= 1) {
                return {
                    interval: interval,
                    ago: "mo"
                };
            }
            interval = Math.floor(seconds / 86400);
            if (interval >= 1) {
                return {
                    interval: interval,
                    ago: "d"
                };
            }
            interval = Math.floor(seconds / 3600);
            if (interval >= 1) {
                return {
                    interval: interval,
                    ago: "h"
                };
            }
            interval = Math.floor(seconds / 60);
            if (interval >= 1) {
                return {
                    interval: interval,
                    ago: "m"
                };
            }
            interval = seconds < 0 ? 0 : Math.floor(seconds);
            if (interval <= 10) {
                return {
                    interval: interval,
                    ago: ""
                };
            }
            return {
                interval: interval,
                ago: "s"
            };
        };
        return toTimeAgo;
    });
    //! src/utils/formatters/toXML.js
    define("toXML", function() {
        var toXML = function(str) {
            var parser, xmlDoc;
            if (window.DOMParser) {
                parser = new DOMParser();
                xmlDoc = parser.parseFromString(str, "text/xml");
            } else {
                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = false;
                xmlDoc.loadXML(str);
            }
            return xmlDoc;
        };
        return toXML;
    });
    //! src/utils/formatters/toXMLString.js
    define("toXMLString", function() {
        var toXMLString = function(xmlObject) {
            var str;
            if (window.ActiveXObject) {
                str = xmlObject.xml;
            } else {
                str = new XMLSerializer().serializeToString(xmlObject);
            }
            str = str.replace(/\sxmlns=".*?"/gim, "");
            return str;
        };
        return toXMLString;
    });
    //! src/utils/geom/rect.js
    define("rect", function() {
        var Rect = function(x, y, width, height) {
            this.x = x || 0;
            this.y = y || 0;
            this.width = width || 0;
            this.height = height || 0;
            this.source = function(value) {
                if (value) {
                    this.x = value.x || 0;
                    this.y = value.y || 0;
                    this.width = value.width || 0;
                    this.height = value.height || 0;
                }
                return this;
            };
            this.pos = function(point) {
                if (point) {
                    this.x = point.x || 0;
                    this.y = point.y || 0;
                }
                return {
                    x: this.x,
                    y: this.y
                };
            };
            this.size = function(point) {
                if (point) {
                    this.width = point.x || point.width || 0;
                    this.height = point.y || point.height || 0;
                }
                return {
                    x: this.width,
                    y: this.height
                };
            };
            this.top = function() {
                return Number(this.y);
            };
            this.left = function() {
                return Number(this.x);
            };
            this.topLeft = function() {
                return {
                    x: Number(this.x),
                    y: Number(this.y)
                };
            };
            this.bottom = function() {
                return Number(this.y) + Number(this.height);
            };
            this.right = function() {
                return Number(this.x) + Number(this.width);
            };
            this.bottomRight = function() {
                return {
                    x: Number(this.x) + Number(this.width),
                    y: Number(this.y) + Number(this.height)
                };
            };
            this.centerX = function() {
                return Number(this.x) + this.width * .5;
            };
            this.centerY = function() {
                return Number(this.y) + this.height * .5;
            };
            this.clone = function() {
                return new geom.Rect(Number(this.x), Number(this.y), Number(this.width), Number(this.height));
            };
            this.contains = function(x, y) {
                x = Number(x);
                y = Number(y);
                return x >= Number(this.x) && x < Number(this.x) + Number(this.width) && y >= Number(this.y) && y < Number(this.y) + Number(this.height);
            };
            this.containsPoint = function(point) {
                return Number(point.x) >= Number(this.x) && Number(point.x) < Number(this.x) + Number(this.width) && Number(point.y) >= Number(this.y) && Number(point.y) < Number(this.y) + Number(this.height);
            };
            this.containsRect = function(rect) {
                var rRect = rect.source();
                var r1 = Number(rRect.x) + Number(rRect.width);
                var b1 = Number(rRect.y) + Number(rRect.height);
                var r2 = Number(this.x) + Number(this.width);
                var b2 = Number(this.y) + Number(this.height);
                return Number(rRect.x) >= Number(this.x) && Number(rRect.x) < r2 && Number(rRect.y) >= Number(this.y) && Number(rRect.y) < b2 && r1 > Number(this.x) && r1 <= r2 && b1 > Number(this.y) && b1 <= b2;
            };
            this.copyFrom = function(sourceRect) {
                this.x = Number(sourceRect.x || 0);
                this.y = Number(sourceRect.y || 0);
                this.width = Number(sourceRect.width || 0);
                this.height = Number(sourceRect.height || 0);
            };
            this.equals = function(toCompare) {
                return Number(toCompare.x) === Number(this.x) && Number(toCompare.y) === Number(this.y) && Number(toCompare.width) === Number(this.width) && Number(toCompare.height) === Number(this.height);
            };
            this.inflate = function(dx, dy) {
                dx = Number(dx);
                dy = Number(dy);
                this.x = Number(this.x) - dx;
                this.width = Number(this.width) + 2 * dx;
                this.y = Number(this.y) - dy;
                this.height = Number(this.height) + 2 * dy;
            };
            this.inflatePoint = function(point) {
                this.x = Number(this.x) - Number(point.x);
                this.width = Number(this.width) + 2 * point.x;
                this.y = Number(this.y) - Number(point.y);
                this.height = Number(this.height) + 2 * point.y;
            };
            this.intersection = function(toIntersect) {
                if (this.isEmpty() || toIntersect.isEmpty()) {
                    return new geom.Rect();
                }
                var resultX = Math.max(Number(this.x), Number(toIntersect.x));
                var resultY = Math.max(Number(this.y), Number(toIntersect.y));
                var resultWidth = Math.min(Number(this.x) + Number(this.width), Number(toIntersect.x) + Number(toIntersect.width)) - resultX;
                var resultHeight = Math.min(Number(this.y) + Number(this.height), Number(toIntersect.y) + Number(toIntersect.height)) - resultY;
                if (resultWidth <= 0 || resultHeight <= 0) {
                    return new geom.Rect();
                }
                return new geom.Rect(resultX, resultY, resultWidth, resultHeight);
            };
            this.intersects = function(toIntersect) {
                if (this.isEmpty() || toIntersect.isEmpty()) {
                    return false;
                }
                var thisX = Number(this.x);
                var thisY = Number(this.y);
                var thisW = Number(this.width);
                var thisH = Number(this.height);
                var intX = Number(toIntersect.x);
                var intY = Number(toIntersect.y);
                var intW = Number(toIntersect.width);
                var intH = Number(toIntersect.height);
                var resultX = Math.max(thisX, intX);
                var resultY = Math.max(thisY, intY);
                var resultWidth = Math.min(thisX + thisW, intX + intW) - resultX;
                var resultHeight = Math.min(thisY + thisH, intY + intH) - resultY;
                if (resultWidth <= 0 || resultHeight <= 0) {
                    return false;
                }
                return true;
            };
            this.isEmpty = function() {
                return Number(this.width) <= 0 || Number(this.height) <= 0;
            };
            this.offset = function(dx, dy) {
                this.x = Number(this.x) + Number(dx);
                this.y = Number(this.y) + Number(dy);
            };
            this.offsetPoint = function(point) {
                this.x = Number(this.x) + Number(point.x);
                this.y = Number(this.y) + Number(point.y);
            };
            this.setEmpty = function() {
                this.x = 0;
                this.y = 0;
                this.width = 0;
                this.height = 0;
            };
            this.toString = function() {
                return "(x=" + this.x + ", y=" + this.y + ", w=" + this.width + ", h=" + this.height + ")";
            };
            this.union = function(toUnion) {
                var r, rect2;
                if (this.isEmpty()) {
                    return toUnion.clone();
                }
                if (toUnion.isEmpty()) {
                    return this.clone();
                }
                r = {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                };
                rect2 = toUnion.source();
                r.x = Math.min(Number(this.x), Number(rect2.x));
                r.y = Math.min(Number(this.y), Number(rect2.y));
                r.width = Math.max(Number(this.x) + Number(this.width), Number(rect2.x) + Number(rect2.width)) - r.x;
                r.height = Math.max(Number(this.y) + Number(this.height), Number(rect2.y) + Number(rect2.height)) - r.y;
                return new geom.Rect(r.x, r.y, r.width, r.height);
            };
        };
        return function(x, y, width, height) {
            return new Rect(x, y, width, height);
        };
    });
    //! src/utils/parsers/functionName.js
    define("functionName", function() {
        return function(fn) {
            var f = typeof fn === "function";
            var s = f && (fn.name && [ "", fn.name ] || fn.toString().match(/function ([^\(]+)/));
            return !f && "not a function" || (s && s[1] || "anonymous");
        };
    });
    //! src/utils/parsers/htmlify.js
    define("htmlify", function() {
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
    });
    //! src/utils/parsers/urls.js
    define("urls", function() {
        var urls = function(str, type) {
            var urls, i, len;
            if (typeof str === "string") {
                var rx = new RegExp('=\\"([^\\"]+\\.(' + type + ')\\")', "gi");
                urls = str.match(rx);
                for (i = 0, len = urls ? urls.length : 0; i < len; ++i) {
                    urls[i] = urls[i].replace(/(\"|=)/g, "");
                }
            }
            return urls || [];
        };
        return urls;
    });
    //! src/utils/patterns/Singleton.js
    define("singleton", function() {
        var Singleton = function() {};
        Singleton.instances = {};
        Singleton.get = function(classRef) {
            if (typeof classRef === "function") {
                if (!classRef.__instance__) {
                    var args = Array.prototype.slice.call(arguments, 0);
                    classRef.__instance__ = new (Function.prototype.bind.apply(classRef, args))();
                }
                return classRef.__instance__;
            }
        };
        Singleton.getById = function(name, classRef) {
            if (typeof classRef === "function") {
                if (!classRef.__instances__) {
                    classRef.__instances__ = {};
                }
                if (!classRef.__instances__[name]) {
                    var args = Array.prototype.slice.call(arguments, 0);
                    classRef.__instances__[name] = new (Function.prototype.bind.apply(classRef, args))();
                }
                return classRef.__instances__[name];
            }
        };
        return Singleton;
    });
    //! src/utils/patterns/command.js
    define("command", [ "dispatcher", "defer", "copy" ], function(dispatcher, defer, copy) {
        function CommandExecutor(commands, args) {
            this.commands = commands;
            this.args = args.splice(0);
        }
        CommandExecutor.counter = 0;
        CommandExecutor.prototype.execute = function(completeCallback) {
            var scope = this, promise;
            if (this.commands.length) {
                promise = this.next(scope.commands.shift());
                promise.then(function() {
                    scope.execute(completeCallback);
                });
            } else {
                completeCallback();
            }
        };
        CommandExecutor.prototype.next = function(command) {
            var deferred = defer(), commandComplete;
            deferred.__uid = CommandExecutor.counter += 1;
            if (typeof command === "function") {
                command = new command();
            } else {
                command = copy(command);
            }
            if (command.execute === undefined) {
                throw new Error('Command expects "execute" to be defined.');
            }
            if (typeof command.execute !== "function") {
                throw new Error('Command expects "execute" to be of type function.');
            }
            if ("complete" in command) {
                commandComplete = command.complete;
                command.complete = function() {
                    commandComplete.apply(command);
                    if ("destruct" in command) {
                        command.destruct();
                    }
                    deferred.resolve();
                };
            } else {
                command.complete = function() {
                    if ("destruct" in command) {
                        command.destruct();
                    }
                    deferred.resolve();
                };
            }
            if ("construct" in command) {
                command.construct.apply(command, this.args);
            }
            command.execute.apply(command, this.args);
            if (commandComplete === undefined) {
                command.complete();
            }
            return deferred.promise;
        };
        function CommandMap() {
            this._mappings = {};
            dispatcher(this);
        }
        CommandMap.prototype.map = function(event) {
            if (typeof event !== "string") {
                throw new Error("Event must of type string.");
            }
            if (!event.length) {
                throw new Error("Event string cannot be empty");
            }
            var scope = this;
            if (!this._mappings[event]) {
                this._mappings[event] = new CommandMapper();
                this._mappings[event].unsubscribe = this.on(event, function() {
                    var args, commandMapper, commandExecutor, promise;
                    args = Array.prototype.slice.call(arguments);
                    args.shift();
                    commandMapper = scope._mappings[event];
                    if (!commandMapper.commandExecutor) {
                        commandMapper.commandExecutor = new CommandExecutor(commandMapper.getCommands(), args);
                        commandMapper.commandExecutor.execute(function() {
                            delete commandMapper.commandExecutor;
                            promise = null;
                        });
                    }
                });
            }
            return this._mappings[event];
        };
        CommandMap.prototype.unmap = function(event, command) {
            if (this._mappings[event]) {
                this._mappings[event].fromCommand(command);
                if (this._mappings[event].isEmpty()) {
                    this._mappings[event].unsubscribe();
                    delete this._mappings[event];
                }
            }
        };
        CommandMap.prototype.umapAll = function() {
            this._mappings = {};
        };
        function CommandMapper() {
            this._commands = [];
            dispatcher(this);
        }
        CommandMapper.prototype.getCommands = function() {
            return this._commands.splice(0);
        };
        CommandMapper.prototype.isEmpty = function() {
            return this._commands.length === 0;
        };
        CommandMapper.prototype.hasCommand = function(command) {
            var len = this._commands.length;
            while (len--) {
                if (this._commands[len] === command) {
                    return true;
                }
            }
            return false;
        };
        CommandMapper.prototype.toCommand = function(command) {
            if (!this.hasCommand(command)) {
                this._commands.push(command);
            }
        };
        CommandMapper.prototype.fromCommand = function(command) {
            var len = this._commands.length;
            while (len--) {
                if (this._commands[len] === command) {
                    this._commands.splice(len, 1);
                    break;
                }
            }
        };
        return new CommandMap();
    });
    //! src/utils/patterns/stateMachine.js
    define("stateMachine", function() {
        var StateMachine = {
            VERSION: "2.3.0",
            Result: {
                SUCCEEDED: 1,
                NOTRANSITION: 2,
                CANCELLED: 3,
                PENDING: 4
            },
            Error: {
                INVALID_TRANSITION: 100,
                PENDING_TRANSITION: 200,
                INVALID_CALLBACK: 300
            },
            WILDCARD: "*",
            ASYNC: "async",
            create: function(cfg, target) {
                var initial = typeof cfg.initial == "string" ? {
                    state: cfg.initial
                } : cfg.initial;
                var terminal = cfg.terminal || cfg["final"];
                var fsm = target || cfg.target || {};
                var events = cfg.events || [];
                var callbacks = cfg.callbacks || {};
                var map = {};
                var add = function(e) {
                    var from = e.from instanceof Array ? e.from : e.from ? [ e.from ] : [ StateMachine.WILDCARD ];
                    map[e.name] = map[e.name] || {};
                    for (var n = 0; n < from.length; n++) map[e.name][from[n]] = e.to || from[n];
                };
                if (initial) {
                    initial.event = initial.event || "startup";
                    add({
                        name: initial.event,
                        from: "none",
                        to: initial.state
                    });
                }
                for (var n = 0; n < events.length; n++) add(events[n]);
                for (var name in map) {
                    if (map.hasOwnProperty(name)) fsm[name] = StateMachine.buildEvent(name, map[name]);
                }
                for (var name in callbacks) {
                    if (callbacks.hasOwnProperty(name)) fsm[name] = callbacks[name];
                }
                fsm.current = "none";
                fsm.is = function(state) {
                    return state instanceof Array ? state.indexOf(this.current) >= 0 : this.current === state;
                };
                fsm.can = function(event) {
                    return !this.transition && (map[event].hasOwnProperty(this.current) || map[event].hasOwnProperty(StateMachine.WILDCARD));
                };
                fsm.cannot = function(event) {
                    return !this.can(event);
                };
                fsm.error = cfg.error || function(name, from, to, args, error, msg, e) {
                    throw e || msg;
                };
                fsm.isFinished = function() {
                    return this.is(terminal);
                };
                if (initial && !initial.defer) fsm[initial.event]();
                return fsm;
            },
            doCallback: function(fsm, func, name, from, to, args) {
                if (func) {
                    try {
                        return func.apply(fsm, [ name, from, to ].concat(args));
                    } catch (e) {
                        return fsm.error(name, from, to, args, StateMachine.Error.INVALID_CALLBACK, "an exception occurred in a caller-provided callback function", e);
                    }
                }
            },
            beforeAnyEvent: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onbeforeevent"], name, from, to, args);
            },
            afterAnyEvent: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onafterevent"] || fsm["onevent"], name, from, to, args);
            },
            leaveAnyState: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onleavestate"], name, from, to, args);
            },
            enterAnyState: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onenterstate"] || fsm["onstate"], name, from, to, args);
            },
            changeState: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onchangestate"], name, from, to, args);
            },
            beforeThisEvent: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onbefore" + name], name, from, to, args);
            },
            afterThisEvent: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onafter" + name] || fsm["on" + name], name, from, to, args);
            },
            leaveThisState: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onleave" + from], name, from, to, args);
            },
            enterThisState: function(fsm, name, from, to, args) {
                return StateMachine.doCallback(fsm, fsm["onenter" + to] || fsm["on" + to], name, from, to, args);
            },
            beforeEvent: function(fsm, name, from, to, args) {
                if (false === StateMachine.beforeThisEvent(fsm, name, from, to, args) || false === StateMachine.beforeAnyEvent(fsm, name, from, to, args)) return false;
            },
            afterEvent: function(fsm, name, from, to, args) {
                StateMachine.afterThisEvent(fsm, name, from, to, args);
                StateMachine.afterAnyEvent(fsm, name, from, to, args);
            },
            leaveState: function(fsm, name, from, to, args) {
                var specific = StateMachine.leaveThisState(fsm, name, from, to, args), general = StateMachine.leaveAnyState(fsm, name, from, to, args);
                if (false === specific || false === general) return false; else if (StateMachine.ASYNC === specific || StateMachine.ASYNC === general) return StateMachine.ASYNC;
            },
            enterState: function(fsm, name, from, to, args) {
                StateMachine.enterThisState(fsm, name, from, to, args);
                StateMachine.enterAnyState(fsm, name, from, to, args);
            },
            buildEvent: function(name, map) {
                return function() {
                    var from = this.current;
                    var to = map[from] || map[StateMachine.WILDCARD] || from;
                    var args = Array.prototype.slice.call(arguments);
                    if (this.transition) return this.error(name, from, to, args, StateMachine.Error.PENDING_TRANSITION, "event " + name + " inappropriate because previous transition did not complete");
                    if (this.cannot(name)) return this.error(name, from, to, args, StateMachine.Error.INVALID_TRANSITION, "event " + name + " inappropriate in current state " + this.current);
                    if (false === StateMachine.beforeEvent(this, name, from, to, args)) return StateMachine.Result.CANCELLED;
                    if (from === to) {
                        StateMachine.afterEvent(this, name, from, to, args);
                        return StateMachine.Result.NOTRANSITION;
                    }
                    var fsm = this;
                    this.transition = function() {
                        fsm.transition = null;
                        fsm.current = to;
                        StateMachine.enterState(fsm, name, from, to, args);
                        StateMachine.changeState(fsm, name, from, to, args);
                        StateMachine.afterEvent(fsm, name, from, to, args);
                        return StateMachine.Result.SUCCEEDED;
                    };
                    this.transition.cancel = function() {
                        fsm.transition = null;
                        StateMachine.afterEvent(fsm, name, from, to, args);
                    };
                    var leave = StateMachine.leaveState(this, name, from, to, args);
                    if (false === leave) {
                        this.transition = null;
                        return StateMachine.Result.CANCELLED;
                    } else if (StateMachine.ASYNC === leave) {
                        return StateMachine.Result.PENDING;
                    } else {
                        if (this.transition) return this.transition();
                    }
                };
            }
        };
        return function(options, target) {
            return StateMachine.create(options, target);
        };
    });
    //! src/utils/polyfills/array.indexOf.js
    internal("array.indexOf", function() {
        if (!Array.prototype.indexOf) {
            Array.prototype.indexOf = function(value) {
                var i = 0, len = this.length, item;
                while (i < len) {
                    if (value === this[i]) return i;
                    i += 1;
                }
                return -1;
            };
        }
        return true;
    });
    //! src/utils/polyfills/date.toISOString.js
    internal("date.toISOString", function() {
        if (!Date.prototype.toISOString) {
            function pad(number) {
                if (number < 10) {
                    return "0" + number;
                }
                return number;
            }
            Date.prototype.toISOString = function() {
                return this.getUTCFullYear() + "-" + pad(this.getUTCMonth() + 1) + "-" + pad(this.getUTCDate()) + "T" + pad(this.getUTCHours()) + ":" + pad(this.getUTCMinutes()) + ":" + pad(this.getUTCSeconds()) + "." + (this.getUTCMilliseconds() / 1e3).toFixed(3).slice(2, 5) + "Z";
            };
        }
        return true;
    });
    //! src/utils/polyfills/string.supplant.js
    internal("string.supplant", function() {
        if (!String.prototype.supplant) {
            String.prototype.supplant = function(o) {
                return this.replace(/{([^{}]*)}/g, function(a, b) {
                    var r = o[b];
                    return typeof r === "string" || typeof r === "number" ? r : a;
                });
            };
        }
        return true;
    });
    //! src/utils/polyfills/string.trim.js
    internal("string.trim", [ "isString" ], function(isString) {
        if (!String.prototype.trim) {
            return function(value) {
                return isString(value) ? value.replace(/^\s\s*/, "").replace(/\s\s*$/, "") : value;
            };
        }
        return true;
    });
    //! src/utils/polyfills/window.console.js
    internal("window.console", function() {
        if (!("console" in window)) {
            window.console = {
                isOverride: true,
                log: function() {},
                warn: function() {},
                info: function() {},
                error: function() {}
            };
        }
        return true;
    });
    //! src/utils/query/event/shortcuts.js
    internal("query.shortcuts", [ "query", "isDefined" ], function(query, isDefined) {
        query.fn.change = function(handler) {
            var scope = this;
            if (isDefined(handler)) {
                scope.on("change", handler);
            } else {
                scope.trigger("change");
            }
            return scope;
        };
        query.fn.click = function(handler) {
            var scope = this;
            if (isDefined(handler)) {
                scope.bind("click", handler);
            } else {
                scope.trigger("click");
            }
            return scope;
        };
    });
    //! src/utils/query/event/trigger.js
    internal("query.trigger", [ "query" ], function(query) {
        query.fn.trigger = function(eventName, data) {
            var event;
            if (document.createEvent) {
                event = document.createEvent("HTMLEvents");
                event.initEvent(eventName, true, true);
            } else {
                event = document.createEventObject();
                event.eventType = eventName;
            }
            event.eventName = eventName;
            event.data = data;
            this.each(function(index, el) {
                if (document.createEvent) {
                    el.dispatchEvent(event);
                } else {
                    el.fireEvent("on" + event.eventType, event);
                }
            });
            return this;
        };
    });
    //! src/utils/query/measure/height.js
    internal("query.height", [ "query", "query.css" ], function(query) {
        query.fn.height = function(val) {
            return this.css("height", val);
        };
    });
    //! src/utils/query/modify/css.js
    internal("query.css", [ "query" ], function(query) {
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
    });
    //! src/utils/query/measure/innerHeight.js
    internal("query.innerHeight", [ "query", "query.css" ], function(query) {
        query.fn.innerHeight = function() {
            return this.css("innerHeight");
        };
    });
    //! src/utils/query/measure/innerWidth.js
    internal("query.innerWidth", [ "query", "query.css" ], function(query) {
        query.fn.innerWidth = function() {
            return this.css("innerWidth");
        };
    });
    //! src/utils/query/measure/offset.js
    internal("query.offset", [ "query" ], function(query) {
        query.fn.offset = function() {
            if (this.length) {
                return this[0].getBoundingClientRect();
            }
        };
    });
    //! src/utils/query/measure/outerHeight.js
    internal("query.outerHeight", [ "query", "query.css" ], function(query) {
        query.fn.outerHeight = function() {
            return this.css("outerHeight");
        };
    });
    //! src/utils/query/measure/outerWidth.js
    internal("query.outerWidth", [ "query", "query.css" ], function(query) {
        query.fn.outerWidth = function() {
            return this.css("outerWidth");
        };
    });
    //! src/utils/query/measure/width.js
    internal("query.width", [ "query", "query.css" ], function(query) {
        query.fn.width = function(val) {
            return this.css("width", val);
        };
    });
    //! src/utils/query/modify/attr.js
    internal("query.attr", [ "query" ], function(query) {
        query.fn.removeAttr = function(prop) {
            this.each(function(index, el) {
                el.removeAttribute(prop);
            });
            return this;
        };
        query.fn.attr = function(prop, value) {
            if (arguments.length === 2) {
                if (typeof value === "function") {
                    this.each(function(index, el) {
                        var result = value.apply(el, [ index, prop ]);
                        this.setAttribute(prop, result);
                    });
                } else {
                    this.each(function(index, el) {
                        el.setAttribute(prop, value);
                    });
                }
                return this;
            }
            if (typeof prop === "object") {
                this.each(function(index, el) {
                    for (var n in prop) {
                        if (prop.hasOwnProperty(n)) {
                            el.setAttribute(n, prop[n]);
                        }
                    }
                });
                return this;
            }
            if (this.length) {
                return this[0].getAttribute(prop);
            }
        };
        query.fn.data = function(prop, value) {
            return this.attr("data-" + prop, value);
        };
    });
    //! src/utils/query/modify/prop.js
    internal("query.prop", [ "query" ], function(query) {
        query.fn.prop = function(name, value) {
            if (this.length) {
                if (arguments.length > 2) {
                    this[0][name] = value;
                } else {
                    return this[0][name];
                }
            }
        };
        query.fn.is = function(name) {
            name = name.split(":").join("");
            return this.prop(name);
        };
    });
    //! src/utils/query/modify/val.js
    internal("query.val", [ "query" ], function(query) {
        query.fn.val = function(value) {
            var el, result, i, len, options;
            if (this.length) {
                el = this[0];
                if (arguments.length) {
                    el.value = value;
                } else {
                    if (el.nodeName === "SELECT" && el.multiple) {
                        result = [];
                        i = 0;
                        options = el.options;
                        len = options.length;
                        while (i < len) {
                            if (options) {
                                result.push(options[i].value || options[0].text);
                            }
                        }
                        return result.length === 0 ? null : result;
                    }
                    return el.value;
                }
            }
        };
    });
    //! src/utils/query/mutate/after.js
    internal("query.after", [ "query" ], function(query) {
        query.fn.after = function(val) {
            var parentNode, i;
            if (typeof val === "string") {
                val = query(val);
            }
            this.each(function(index, el) {
                parentNode = el.parentNode;
                i = val.length;
                while (i--) {
                    el.insertAdjacentHTML("afterEnd", val[i].outerHTML);
                }
            });
        };
    });
    //! src/utils/query/mutate/append.js
    internal("query.append", [ "query" ], function(query) {
        query.fn.append = function(val) {
            var parentNode, i, len;
            if (typeof val === "string") {
                val = query(val);
            }
            this.each(function(index, el) {
                parentNode = el.parentNode;
                i = 0;
                len = val.length;
                while (i < len) {
                    el.insertAdjacentHTML("beforeEnd", val[i].outerHTML);
                    i += 1;
                }
            });
        };
    });
    //! src/utils/query/mutate/before.js
    internal("query.before", [ "query" ], function(query) {
        query.fn.before = function(val) {
            var parentNode, i, len;
            if (typeof val === "string") {
                val = query(val);
            }
            this.each(function(index, el) {
                parentNode = el.parentNode;
                i = 0;
                len = val.length;
                while (i < len) {
                    el.insertAdjacentHTML("beforeBegin", val[i].outerHTML);
                    i += 1;
                }
            });
        };
    });
    //! src/utils/query/mutate/empty.js
    internal("query.empty", [ "query" ], function(query) {
        query.fn.empty = function() {
            this.each(function(index, el) {
                el.innerHTML = null;
            });
        };
    });
    //! src/utils/query/mutate/html.js
    internal("query.html", [ "query" ], function(query) {
        query.fn.html = function(val) {
            if (this.length) {
                var el = this[0];
                if (arguments.length > 0) {
                    this.each(function(index, el) {
                        el.innerHTML = val;
                    });
                }
                return el.innerHTML;
            }
        };
    });
    //! src/utils/query/mutate/prepend.js
    internal("query.prepend", [ "query" ], function(query) {
        query.fn.prepend = function(elements) {
            var i, len;
            if (typeof elements === "string") {
                elements = query(elements);
            }
            this.each(function(index, el) {
                i = elements.length;
                while (i--) {
                    el.insertAdjacentHTML("afterBegin", elements[i].outerHTML);
                }
            });
        };
    });
    //! src/utils/query/mutate/remove.js
    internal("query.remove", [ "query" ], function(query) {
        query.fn.remove = function() {
            this.each(function(index, el) {
                if (el.parentElement) {
                    el.parentElement.removeChild(el);
                }
            });
        };
    });
    //! src/utils/query/mutate/replace.js
    internal("query.replace", [ "query" ], function(query) {
        query.fn.replace = function(val) {
            if (this.length) {
                var el = this[0];
                if (arguments.length > 0) {
                    this.each(function(index, el) {
                        el.innerHTML = val;
                    });
                }
                return el.innerHTML;
            }
        };
    });
    //! src/utils/query/mutate/text.js
    internal("query.text", [ "query" ], function(query) {
        query.fn.text = function(val) {
            if (this.length) {
                var el = this[0];
                if (arguments.length > 0) {
                    this.each(function(index, el) {
                        el.innerText = val;
                    });
                }
                return el.innerText;
            }
        };
    });
    //! src/utils/query/queryBuilder.js
    define("queryBuilder", function() {
        var omitAttrs, uniqueAttrs, classFilters, classFiltersFctn, queryBuilder;
        function query(selectorStr, el) {
            el = el || queryBuilder.config.doc.body;
            var rx = /:eq\((\d+)\)$/, match = selectorStr.match(rx), result, count;
            if (match && match.length) {
                selectorStr = selectorStr.replace(rx, "");
                count = match[1];
            }
            result = el.querySelectorAll(selectorStr);
            if (result && count !== undefined) {
                return result[count];
            }
            return result;
        }
        function getCleanSelector(el, ignoreClass) {
            el = validateEl(el);
            if (el) {
                var ignore = buildIgnoreFunction(ignoreClass), matches, index, str, maxParent = queryBuilder.config.doc.body, selector = getSelectorData(el, maxParent, ignore, null, true);
                while (selector.count > selector.totalCount) {
                    selector = selector.parent;
                }
                selector = selector.parent || selector;
                str = selector.str || selectorToString(selector);
                if (selector.str) {
                    var child = selector.child;
                    while (child) {
                        str += " " + child.str;
                        child = child.child;
                    }
                }
                if (selector.count > 1 || selector.child && selector.child.count) {
                    matches = Array.prototype.slice.apply(query(str, maxParent));
                    index = matches.indexOf(el);
                    str += ":eq(" + index + ")";
                }
                str += getVisible();
                return str;
            }
            return "";
        }
        function quickSelector(element, maxParent, ignoreClass) {
            element = validateEl(element);
            if (element) {
                var ignore = buildIgnoreFunction(ignoreClass), selector = getSelectorData(element, maxParent, ignore);
                return selectorToString(selector) + getVisible();
            }
            return "";
        }
        function validateEl(el) {
            return el;
        }
        function getVisible() {
            return queryBuilder.config.addVisible ? ":visible" : "";
        }
        function matchesClass(item, matcher) {
            if (typeof matcher === "string" && matcher === item) {
                return true;
            }
            if (typeof matcher === "object" && item.match(matcher)) {
                return true;
            }
            return false;
        }
        function getSelectorData(element, maxParent, ignoreClass, child, smartSelector) {
            var result;
            if (!element) {
                return "";
            }
            maxParent = maxParent || queryBuilder.config.doc;
            result = {
                element: element,
                ignoreClass: ignoreClass,
                maxParent: maxParent,
                classes: getClasses(element, ignoreClass),
                attributes: getAttributes(element, child),
                type: element.nodeName && element.nodeName.toLowerCase() || "",
                child: child
            };
            if (!result.attributes.$unique || child) {
                if (smartSelector) {
                    result.str = selectorToString(result, 0, null, true);
                    result.count = maxParent.querySelectorAll(result.str).length;
                    if (result.count > 1) {
                        result.parent = getParentSelector(element, maxParent, ignoreClass, result, smartSelector);
                    }
                } else {
                    result.parent = getParentSelector(element, maxParent, ignoreClass, result, smartSelector);
                }
            }
            return result;
        }
        function filterNumbers(item) {
            return typeof item !== "number";
        }
        function buildIgnoreFunction(ignoreClasses) {
            ignoreClasses = ignoreClasses || [];
            if (typeof ignoreClasses === "function") {
                return ignoreClasses;
            }
            return function(cls) {
                if (ignoreClasses instanceof Array) {
                    var i = 0, iLen = ignoreClasses.length;
                    while (i < iLen) {
                        if (matchesClass(cls, ignoreClasses[i])) {
                            return false;
                        }
                        i += 1;
                    }
                } else if (matchesClass(cls, ignoreClasses)) {
                    return false;
                }
                return true;
            };
        }
        function getClasses(element, ignoreClass) {
            var classes = data.filter(element.classList, filterNumbers);
            classes = data.filter(classes, classFiltersFctn);
            return data.filter(classes, ignoreClass);
        }
        function getAttributes(element, child) {
            var i = 0, len = element.attributes ? element.attributes.length : 0, attr, attributes = [], uniqueAttr = getUniqueAttribute(element.attributes);
            if (uniqueAttr) {
                if (uniqueAttr.name === "id" && queryBuilder.config.allowId) {
                    attributes.push("#" + uniqueAttr.value);
                } else if (uniqueAttr.name !== "id") {
                    attributes.push(createAttrStr(uniqueAttr));
                }
                if (attributes.length) {
                    attributes.$unique = true;
                    return attributes;
                }
            }
            if (queryBuilder.config.allowAttributes) {
                while (i < len) {
                    attr = element.attributes[i];
                    if (!omitAttrs[attr.name] && !uniqueAttrs[attr.name]) {
                        attributes.push(createAttrStr(attr));
                    }
                    i += 1;
                }
            }
            return attributes;
        }
        function createAttrStr(attr) {
            return "[" + camelCase(attr.name) + "='" + escapeQuotes(attr.value) + "']";
        }
        function getUniqueAttribute(attributes) {
            var attr, i = 0, len = attributes ? attributes.length : 0, name;
            while (i < len) {
                attr = attributes[i];
                name = camelCase(attr.name);
                if (uniqueAttrs[name]) {
                    return attr;
                }
                i += 1;
            }
            return null;
        }
        function camelCase(name) {
            var ary, i = 1, len;
            if (name.indexOf("-")) {
                ary = name.split("-");
                len = ary.length;
                while (i < len) {
                    ary[i] = ary[i].charAt(0).toUpperCase() + ary[i].substr(1);
                    i += 1;
                }
                name = ary.join("");
            }
            return name;
        }
        function escapeQuotes(str) {
            return str.replace(/"/g, "&quot;").replace(/'/g, "&apos;");
        }
        function selectorToString(selector, depth, overrideMaxParent, skipCount) {
            var matches, str, parent;
            depth = depth || 0;
            str = selector && !selector.attributes.$unique ? selectorToString(selector.parent, depth + 1) : "";
            if (selector) {
                str += (str.length ? " " : "") + getSelectorString(selector);
            }
            if (!depth && !skipCount) {
                parent = overrideMaxParent || selector.maxParent;
                matches = parent.querySelectorAll && parent.querySelectorAll(str) || [];
                if (matches.length > 1) {
                    str += ":eq(" + getIndexOfTarget(matches, selector.element) + ")";
                }
            }
            return str;
        }
        function getSelectorString(selector) {
            if (selector.attributes.$unique) {
                return selector.attributes[0];
            }
            return selector.type + selector.attributes.join("") + (selector.classes.length ? "." + selector.classes.join(".") : "");
        }
        function getParentSelector(element, maxParent, ignoreClass, child, detailed) {
            var parent = element.parentNode;
            if (parent && parent !== maxParent) {
                return getSelectorData(element.parentNode, maxParent, ignoreClass, child, detailed);
            }
            return null;
        }
        function getIndexOfTarget(list, element) {
            var i, iLen = list.length;
            for (i = 0; i < iLen; i += 1) {
                if (element === list[i]) {
                    return i;
                }
            }
            return -1;
        }
        function getList(obj) {
            var ary = [], i;
            for (i in obj) {
                if (obj.hasOwnProperty(i)) {
                    ary.push(obj[i]);
                }
            }
            return ary;
        }
        queryBuilder = {
            config: {
                doc: window.document,
                allowId: true,
                allowAttributes: true,
                addVisible: false
            },
            addOmitAttrs: function(name) {
                each(arguments, function(name) {
                    omitAttrs[name] = true;
                });
                return this;
            },
            removeOmitAttrs: function(name) {
                each(arguments, function(name) {
                    delete omitAttrs[name];
                });
                return this;
            },
            getOmitAttrs: function() {
                return getList(omitAttrs);
            },
            resetOmitAttrs: function() {
                omitAttrs = {
                    "class": true,
                    style: true
                };
            },
            addUniqueAttrs: function(name) {
                each(arguments, function(name) {
                    uniqueAttrs[name] = true;
                });
                return this;
            },
            removeUniqueAttrs: function(name) {
                each(arguments, function(name) {
                    delete uniqueAttrs[name];
                });
                return this;
            },
            getUniqueAttrs: function() {
                return getList(uniqueAttrs);
            },
            resetUniqueAttrs: function() {
                uniqueAttrs = {
                    id: true,
                    uid: true
                };
            },
            addClassOmitFilters: function() {
                each(arguments, function(filter) {
                    classFilters.push(filter);
                });
                classFiltersFctn = buildIgnoreFunction(classFilters);
                return this;
            },
            removeClassOmitFilters: function() {
                each(arguments, function(filter) {
                    var index = classFilters.indexOf(filter);
                    if (index !== -1) {
                        classFilters.splice(index, 1);
                    }
                });
                classFiltersFctn = buildIgnoreFunction(classFilters);
                return this;
            },
            getClassOmitFilters: function() {
                return classFilters.slice(0);
            },
            resetClassOmitFilters: function() {
                classFilters = [];
                classFiltersFctn = buildIgnoreFunction(classFilters);
            },
            query: query,
            get: getCleanSelector,
            getCleanSelector: getCleanSelector,
            quickSelector: quickSelector,
            reset: function() {
                queryBuilder.resetOmitAttrs();
                queryBuilder.resetUniqueAttrs();
                queryBuilder.resetClassOmitFilters();
            }
        };
        queryBuilder.reset();
        return queryBuilder;
    });
    //! src/utils/query/select/children.js
    internal("query.children", [ "query" ], function(query) {
        query.fn.children = function() {
            var list = [], i, len;
            this.each(function(index, el) {
                list = list.concat(el.childNodes);
                var nodes = el.childNodes;
                i = 0;
                len = nodes.length;
                while (i < len) {
                    list.push(nodes[i]);
                    i += 1;
                }
            });
            return query(list);
        };
    });
    //! src/utils/query/select/find.js
    internal("query.find", [ "query" ], function(query) {
        query.fn.find = function(selector) {
            if (this.length) {
                return query(selector, this[0]);
            }
            return query();
        };
    });
    //! src/utils/query/select/first.js
    internal("query.first", [ "query" ], function(query) {
        query.fn.first = function(returnElement) {
            if (this.length) {
                if (returnElement) {
                    return this[0];
                }
                return query(this[0]);
            }
            if (returnElement) {
                return null;
            }
            return query();
        };
    });
    //! src/utils/query/select/get.js
    internal("query.get", [ "query", "isDefined" ], function(query, isDefined) {
        query.fn.get = function(index) {
            if (isDefined(index)) {
                if (Math.abs(index) < this.length) {
                    if (index < 0) {
                        return this[this.length + index - 1];
                    }
                    return this[index];
                }
                return this;
            }
            return this.splice(0);
        };
    });
    //! src/utils/query/select/last.js
    internal("query.last", [ "query" ], function(query) {
        query.fn.last = function(returnElement) {
            if (this.length) {
                if (returnElement) {
                    return this[this.length - 1];
                }
                return query(this[this.length - 1]);
            }
            if (returnElement) {
                return null;
            }
            return query();
        };
    });
    //! src/utils/query/select/next.js
    internal("query.next", [ "query" ], function(query) {
        query.fn.next = function() {
            var list = [], i, len;
            this.each(function(index, el) {
                list = list.concat(el.childNodes);
                var node = el.nextElementSibling;
                if (node) {
                    list.push(node);
                }
            });
            return query(list);
        };
    });
    //! src/utils/query/select/not.js
    internal("query.not", [ "query" ], function(query) {
        query.fn.not = function(selector) {
            if (this.length) {
                return query(":not(" + selector + ")", this[0]);
            }
            return query();
        };
    });
    //! src/utils/query/select/parent.js
    internal("query.parent", [ "query" ], function(query) {
        query.fn.parent = function(selector) {
            if (this.length) {
                var parent = this[0].parentNode;
                if (parent && parent.nodeType !== 11) {
                    if (selector) {
                        return query(parent).find(selector);
                    }
                    return query(parent);
                }
            }
            return query();
        };
    });
    //! src/utils/query/select/prev.js
    internal("query.prev", [ "query" ], function(query) {
        query.fn.prev = function() {
            var list = [];
            this.each(function(index, el) {
                list = list.concat(el.childNodes);
                var node = el.previousElementSibling;
                if (node) {
                    list.push(node);
                }
            });
            return query(list);
        };
    });
    //! src/utils/query/validators/isChecked.js
    internal("query.isChecked", [ "query" ], function(query) {
        query.fn.isChecked = function() {
            if (this.length) {
                return this[0].checked;
            }
            return false;
        };
    });
    //! src/utils/query/validators/isVisible.js
    internal("query.isVisible", [ "query" ], function(query) {
        query.fn.isVisible = function() {
            var el;
            if (this.length) {
                el = this[0];
                if (el.parentNode.nodeType === 9) {
                    return true;
                }
                if (el.offsetWidth === 0 || el.offsetHeight === 0) {
                    return false;
                }
                if (el.style.display === "none") {
                    return false;
                }
                if (el.style.visibility === "hidden") {
                    return false;
                }
                if (el.style.opacity === 0 || el.style.opacity === "0") {
                    return false;
                }
                return true;
            }
            return false;
        };
    });
    //! src/utils/timers/repeater.js
    define("repeater", function() {
        var Repeater = function(delay, repeat, limit) {
            var scope = this;
            scope.count = 0;
            scope.delay = delay || 300;
            scope.repeat = repeat || 50;
            scope.limit = limit || 0;
        };
        var p = Repeater.prototype;
        p.check = function() {
            var scope = this;
            scope.count += 1;
            if (scope.limit && scope.count >= scope.limit) {
                scope.stop();
            }
        };
        p.start = function(callback) {
            var scope = this;
            var isFunction = typeof callback;
            scope.count = 0;
            scope.t = setTimeout(function() {
                scope.t = setInterval(function() {
                    scope.check();
                    if (isFunction) {
                        callback(scope);
                    }
                }, scope.repeat);
                scope.check();
                if (isFunction) {
                    callback(scope);
                }
            }, scope.delay);
            scope.check();
            if (isFunction) {
                callback(scope);
            }
        };
        p.stop = function() {
            var scope = this;
            clearTimeout(scope.t);
            clearInterval(scope.t);
        };
        return function(delay, repeat, limit) {
            return new Repeater(delay, repeat, limit);
        };
    });
    //! src/utils/timers/stopwatch.js
    define("stopwatch", [ "timer", "dispatcher" ], function(Timer, dispatcher) {
        var Stopwatch = function(options) {
            options = options || {};
            var scope = this, timer, done = false, _currentTime = 0, currentTime = 0, countdownTime = 0, startTime = options.startTime || 0, endTime = options.endTime || 0, tick = options.tick || 1e3, frequency = 10;
            function init() {
                scope.options = options;
                countdownTime = endTime;
                setupTimer();
                setupDispatcher();
                setupAPI();
                setupListeners();
                setTimeout(function() {
                    scope.dispatch(Stopwatch.events.READY);
                });
            }
            function setupTimer() {
                timer = new Timer({
                    frequency: frequency
                });
            }
            function setupDispatcher() {
                dispatcher(scope);
            }
            function setupAPI() {
                scope.start = start;
                scope.stop = stop;
                scope.reset = reset;
                scope.getTime = getTime;
                scope.getCountdown = getCountdown;
                scope.getTimeRemaining = getTimeRemaining;
                scope.getState = getState;
            }
            function setupListeners() {
                timer.on("start", onStart);
                timer.on("change", onChange);
                timer.on("stop", onStop);
                timer.on("reset", onReset);
            }
            function getTime() {
                var time = Math.floor(currentTime / tick) * tick;
                return time + startTime;
            }
            function getCountdown() {
                return countdownTime;
            }
            function getTimeRemaining() {
                var time = getTime();
                if (endTime) {
                    return endTime - time;
                }
                return 0;
            }
            function roundTime(time) {
                return Math.floor(time / tick) * tick;
            }
            function getState() {
                return timer.current;
            }
            function updateTime(time) {
                currentTime = roundTime(time);
                if (endTime) {
                    countdownTime = endTime - currentTime;
                }
            }
            function start() {
                if (getState() === "ready") {
                    timer.start();
                }
            }
            function stop() {
                timer.stop();
            }
            function reset() {
                timer.reset();
            }
            function onStart(evt, time) {
                updateTime(time);
                scope.dispatch(Stopwatch.events.START);
            }
            function onChange(evt, time) {
                _currentTime = currentTime;
                updateTime(time);
                if (_currentTime !== currentTime) {
                    _currentTime = currentTime;
                    scope.dispatch(Stopwatch.events.CHANGE);
                    if (endTime) {
                        if (getTime() >= endTime) {
                            onDone(evt, time);
                        }
                    }
                }
            }
            function onStop(evt, time) {
                updateTime(time);
                scope.dispatch(Stopwatch.events.STOP);
            }
            function onReset(evt, time) {
                updateTime(time);
                scope.dispatch(Stopwatch.events.RESET);
            }
            function onDone(evt, time) {
                done = true;
                scope.dispatch(Stopwatch.events.DONE);
                timer.stop();
            }
            init();
        };
        Stopwatch.events = {
            READY: "ready",
            START: "start",
            STOP: "stop",
            RESET: "reset",
            CHANGE: "change",
            DONE: "done",
            ERROR: "error"
        };
        return function(options) {
            return new Stopwatch(options);
        };
    });
    //! src/utils/timers/timer.js
    define("timer", [ "dispatcher", "stateMachine" ], function(dispatcher, stateMachine) {
        var Timer = function(options) {
            options = options || {};
            var scope = this, startTime = 0, totalTime = 0, elapsedTime = 0, timer;
            function init() {
                setupStateMachine();
                setupDispatcher();
            }
            function setupStateMachine() {
                stateMachine({
                    target: scope,
                    initial: "ready",
                    error: onError,
                    events: [ {
                        name: "start",
                        from: "ready",
                        to: "running"
                    }, {
                        name: "start",
                        from: "stop",
                        to: "running"
                    }, {
                        name: "stop",
                        from: "running",
                        to: "stop"
                    }, {
                        name: "reset",
                        from: "stop",
                        to: "ready"
                    } ],
                    callbacks: {
                        onafterstart: onStart,
                        onafterstop: onStop,
                        onafterreset: onReset
                    }
                });
            }
            function setupDispatcher() {
                dispatcher(scope);
            }
            function onStart() {
                startTime = Date.now();
                timer = setInterval(function() {
                    elapsedTime = getTime();
                    scope.dispatch(Timer.events.CHANGE, getTotalTime());
                }, options.frequency || 1e3);
                scope.dispatch(Timer.events.START, totalTime);
            }
            function onStop() {
                clearInterval(timer);
                elapsedTime = getTime();
                totalTime += elapsedTime;
                scope.dispatch(Timer.events.STOP, totalTime);
            }
            function onReset() {
                totalTime = 0;
                scope.dispatch(Timer.events.RESET, totalTime);
            }
            function onError(eventName, from, to, args, errorCode, errorMessage) {
                scope.dispatch(Timer.events.ERROR, {
                    name: eventName,
                    from: from,
                    to: to,
                    args: args,
                    errorCode: errorCode,
                    errorMessage: errorMessage
                });
            }
            function getTime() {
                if (scope.current === "ready") {
                    return 0;
                }
                return Date.now() - startTime;
            }
            function getTotalTime() {
                var elapsedTime = getTime();
                return totalTime + elapsedTime;
            }
            scope.getTime = getTime;
            scope.getTotalTime = getTotalTime;
            init();
        };
        Timer.events = {
            START: "start",
            STOP: "stop",
            RESET: "reset",
            CHANGE: "change",
            ERROR: "error"
        };
        return function(options) {
            return new Timer(options);
        };
    });
    //! src/utils/validators/isArrayLike.js
    define("isArrayLike", [ "isWindow", "isString", "isArray" ], function(isWindow, isString, isArray) {
        var isArrayLike = function(obj) {
            if (obj === null || isWindow(obj)) {
                return false;
            }
            var length = obj.length;
            if (obj.nodeType === 1 && length) {
                return true;
            }
            return isString(obj) || isArray(obj) || length === 0 || typeof length === "number" && length > 0 && length - 1 in obj;
        };
        return isArrayLike;
    });
    //! src/utils/validators/isBoolean.js
    define("isBoolean", function() {
        var isBoolean = function(val) {
            return typeof val === "boolean";
        };
        return isBoolean;
    });
    //! src/utils/validators/isEmail.js
    define("isEmail", function() {
        var isEmail = function(val) {
            var regExp = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9])+$/;
            return regExp.test(value + "");
        };
        return isEmail;
    });
    //! src/utils/validators/isEqual.js
    define("isEqual", function() {
        var isEqual = function(src, target, deep) {
            var srcKeys, targetKeys, srcLen, targetLen, i, s, t;
            if (typeof src === "string" || typeof src === "number" || typeof src === "boolean") {
                return src === target;
            }
            srcKeys = Object.keys(src);
            targetKeys = Object.keys(target);
            srcLen = srcKeys.length;
            targetLen = targetKeys.length;
            if (srcLen !== targetLen) {
                return false;
            }
            if (deep) {
                for (i = 0; i < srcLen; i += 1) {
                    s = src[srcKeys[i]];
                    t = src[targetKeys[i]];
                    if (typeof s === "object" && t && !isEqual(src[srcKeys[i]], target[srcKeys[i]], deep)) {
                        return false;
                    }
                }
            }
            return true;
        };
        return isEqual;
    });
    //! src/utils/validators/isFile.js
    define("isFile", [ "toString" ], function(toString) {
        var isFile = function(obj) {
            return toString.call(obj) === "[object File]";
        };
        return isFile;
    });
    //! src/utils/validators/isFunction.js
    define("isFunction", function() {
        var isFunction = function(val) {
            return typeof val === "function";
        };
        return isFunction;
    });
    //! src/utils/validators/isInt.js
    define("isInt", function() {
        var isInt = function(val) {
            return String(val).search(/^\s*(\-)?\d+\s*$/) !== -1;
        };
        return isInt;
    });
    //! src/utils/validators/isJson.js
    define("isJson", function() {
        var isJson = function(str) {
            try {
                JSON.parse(str);
            } catch (e) {
                return false;
            }
            return true;
        };
        return isJson;
    });
    //! src/utils/validators/isMobile.js
    /**
 * isMobile.js v0.3.2
 *
 * A simple library to detect Apple phones and tablets,
 * Android phones and tablets, other mobile devices (like blackberry, mini-opera and windows phone),
 * and any kind of seven inch device, via user agent sniffing.
 *
 * @author: Kai Mallea (kmallea@gmail.com)
 *
 * @license: http://creativecommons.org/publicdomain/zero/1.0/
 */
    define("isMobile", function() {
        var apple_phone = /iPhone/i, apple_ipod = /iPod/i, apple_tablet = /iPad/i, android_phone = /(?=.*\bAndroid\b)(?=.*\bMobile\b)/i, android_tablet = /Android/i, windows_phone = /IEMobile/i, windows_tablet = /(?=.*\bWindows\b)(?=.*\bARM\b)/i, other_blackberry = /BlackBerry/i, other_opera = /Opera Mini/i, other_firefox = /(?=.*\bFirefox\b)(?=.*\bMobile\b)/i, seven_inch = new RegExp("(?:" + "Nexus 7" + "|" + "BNTV250" + "|" + "Kindle Fire" + "|" + "Silk" + "|" + "GT-P1000" + ")", "i");
        var match = function(regex, userAgent) {
            return regex.test(userAgent);
        };
        var IsMobileClass = function(userAgent) {
            var ua = userAgent || navigator.userAgent;
            this.apple = {
                phone: match(apple_phone, ua),
                ipod: match(apple_ipod, ua),
                tablet: match(apple_tablet, ua),
                device: match(apple_phone, ua) || match(apple_ipod, ua) || match(apple_tablet, ua)
            };
            this.android = {
                phone: match(android_phone, ua),
                tablet: !match(android_phone, ua) && match(android_tablet, ua),
                device: match(android_phone, ua) || match(android_tablet, ua)
            };
            this.windows = {
                phone: match(windows_phone, ua),
                tablet: match(windows_tablet, ua),
                device: match(windows_phone, ua) || match(windows_tablet, ua)
            };
            this.other = {
                blackberry: match(other_blackberry, ua),
                opera: match(other_opera, ua),
                firefox: match(other_firefox, ua),
                device: match(other_blackberry, ua) || match(other_opera, ua) || match(other_firefox, ua)
            };
            this.seven_inch = match(seven_inch, ua);
            this.any = this.apple.device || this.android.device || this.windows.device || this.other.device || this.seven_inch;
            this.phone = this.apple.phone || this.android.phone || this.windows.phone;
            this.tablet = this.apple.tablet || this.android.tablet || this.windows.tablet;
            if (typeof window === "undefined") {
                return this;
            }
        };
        var instantiate = function() {
            var IM = new IsMobileClass();
            IM.Class = IsMobileClass;
            return IM;
        };
        return instantiate();
    });
    //! src/utils/validators/isMobile.js
    /**
 * isMobile.js v0.3.2
 *
 * A simple library to detect Apple phones and tablets,
 * Android phones and tablets, other mobile devices (like blackberry, mini-opera and windows phone),
 * and any kind of seven inch device, via user agent sniffing.
 *
 * @author: Kai Mallea (kmallea@gmail.com)
 *
 * @license: http://creativecommons.org/publicdomain/zero/1.0/
 */
    define("isMobile", function() {
        var apple_phone = /iPhone/i, apple_ipod = /iPod/i, apple_tablet = /iPad/i, android_phone = /(?=.*\bAndroid\b)(?=.*\bMobile\b)/i, android_tablet = /Android/i, windows_phone = /IEMobile/i, windows_tablet = /(?=.*\bWindows\b)(?=.*\bARM\b)/i, other_blackberry = /BlackBerry/i, other_opera = /Opera Mini/i, other_firefox = /(?=.*\bFirefox\b)(?=.*\bMobile\b)/i, seven_inch = new RegExp("(?:" + "Nexus 7" + "|" + "BNTV250" + "|" + "Kindle Fire" + "|" + "Silk" + "|" + "GT-P1000" + ")", "i");
        var match = function(regex, userAgent) {
            return regex.test(userAgent);
        };
        var IsMobileClass = function(userAgent) {
            var ua = userAgent || navigator.userAgent;
            this.apple = {
                phone: match(apple_phone, ua),
                ipod: match(apple_ipod, ua),
                tablet: match(apple_tablet, ua),
                device: match(apple_phone, ua) || match(apple_ipod, ua) || match(apple_tablet, ua)
            };
            this.android = {
                phone: match(android_phone, ua),
                tablet: !match(android_phone, ua) && match(android_tablet, ua),
                device: match(android_phone, ua) || match(android_tablet, ua)
            };
            this.windows = {
                phone: match(windows_phone, ua),
                tablet: match(windows_tablet, ua),
                device: match(windows_phone, ua) || match(windows_tablet, ua)
            };
            this.other = {
                blackberry: match(other_blackberry, ua),
                opera: match(other_opera, ua),
                firefox: match(other_firefox, ua),
                device: match(other_blackberry, ua) || match(other_opera, ua) || match(other_firefox, ua)
            };
            this.seven_inch = match(seven_inch, ua);
            this.any = this.apple.device || this.android.device || this.windows.device || this.other.device || this.seven_inch;
            this.phone = this.apple.phone || this.android.phone || this.windows.phone;
            this.tablet = this.apple.tablet || this.android.tablet || this.windows.tablet;
            if (typeof window === "undefined") {
                return this;
            }
        };
        var instantiate = function() {
            var IM = new IsMobileClass();
            IM.Class = IsMobileClass;
            return IM;
        };
        return instantiate();
    });
    //! src/utils/validators/isNumeric.js
    define("isNumeric", function() {
        var isNumeric = function(val) {
            return !isNaN(parseFloat(val)) && isFinite(val);
        };
        return isNumeric;
    });
    //! src/utils/validators/isRequired.js
    define("isRequired", function() {
        var isRequired = function(value, message) {
            if (typeof value === "undefined") {
                throw new Error(message || 'The property "' + value + '" is required');
            }
        };
        return isRequired;
    });
    //! src/utils/validators/isTrue.js
    define("isTrue", function() {
        var emptyStr = "";
        var isTrue = function() {
            return {
                operators: [ "eq", "neq", "~eq", "~neq", "gt", "lt", "gte", "lte" ],
                test: function(valA, operator, valB) {
                    if (!isNaN(valA) && !isNaN(valB)) {
                        valA = Number(valA);
                        valB = Number(valB);
                    } else {
                        valA = valA === undefined ? emptyStr : valA;
                        valB = valB === undefined ? emptyStr : valB;
                    }
                    switch (operator) {
                      case "eq":
                        return valA + emptyStr === valB + emptyStr;

                      case "neq":
                        return valA + emptyStr !== valB + emptyStr;

                      case "~eq":
                        return (valA + emptyStr).toLowerCase() === (valB + emptyStr).toLowerCase();

                      case "~neq":
                        return (valA + emptyStr).toLowerCase() !== (valB + emptyStr).toLowerCase();

                      case "gt":
                        return valA > valB;

                      case "lt":
                        return valA < valB;

                      case "gte":
                        return valA >= valB;

                      case "lte":
                        return valA <= valB;
                    }
                }
            };
        };
        return isTrue;
    });
    for (var name in $$cache) {
        resolve(name, $$cache[name]);
    }
})(this["utils"] || {}, function() {
    return this;
}());