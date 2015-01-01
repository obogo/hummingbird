(function(exports, global) {
    global["framework"] = exports;
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
    //! src/framework/directives/model.js
    internal("directives.model", [ "framework", "resolve", "query", "query.bind", "query.unbindAll" ], function(framework, resolve, query) {
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
        //! query.bind
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
        //! query.unbindAll
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
    for (var name in $$cache) {
        resolve(name, $$cache[name]);
    }
})(this["framework"] || {}, function() {
    return this;
}());