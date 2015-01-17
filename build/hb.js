(function(exports, global) {
    global["hb"] = exports;
    var $$ = function(name) {
        if (!$$[name]) {
            $$[name] = {};
        }
        return $$[name];
    };
    var cache = $$("c");
    var internals = $$("i");
    var pending = $$("p");
    exports.$$ = $$;
    var toArray = function(args) {
        return Array.prototype.slice.call(args);
    };
    var _ = function(name) {
        var args = toArray(arguments);
        var val = args[1];
        if (typeof val === "function") {
            this.c[name] = val();
        } else {
            cache[name] = args[2];
            cache[name].$inject = val;
            cache[name].$internal = this.i;
        }
    };
    var define = function() {
        _.apply({
            i: false,
            c: exports
        }, toArray(arguments));
    };
    var internal = function() {
        _.apply({
            i: true,
            c: internals
        }, toArray(arguments));
    };
    var resolve = function(name, fn) {
        pending[name] = true;
        var injections = fn.$inject;
        var args = [];
        var injectionName;
        for (var i in injections) {
            if (injections.hasOwnProperty(i)) {
                injectionName = injections[i];
                if (cache[injectionName]) {
                    if (pending.hasOwnProperty(injectionName)) {
                        throw new Error('Cyclical reference: "' + name + '" referencing "' + injectionName + '"');
                    }
                    resolve(injectionName, cache[injectionName]);
                    delete cache[injectionName];
                }
            }
        }
        if (!exports[name] && !internals[name]) {
            for (var n in injections) {
                injectionName = injections[n];
                args.push(exports[injectionName] || internals[injectionName]);
            }
            if (fn.$internal) {
                internals[name] = fn.apply(null, args) || name;
            } else {
                exports[name] = fn.apply(null, args) || name;
            }
        }
        Object.defineProperty(exports, "$$", {
            enumerable: false,
            writable: false
        });
        delete pending[name];
    };
    //! src/hb/filters/lower.js
    //! pattern /(\|lower|\(\'lower\'\))/
    internal("hbf.lower", [ "hb.filter" ], function(filter) {
        filter("lower", function() {
            return function(val) {
                return (val + "").toLowerCase();
            };
        });
    });
    //! src/hb/debug/debugger.js
    define("hb.debugger", function() {
        function Debugger() {
            function getEl(scope) {
                return document.querySelector("[go-id='" + scope.$id + "']");
            }
            this.getEl = getEl;
        }
        return new Debugger();
    });
    //! src/hb/directives/autoscroll.js
    internal("hbd.autoscroll", [ "hb.directive", "query" ], function(directive, query) {
        directive("hbAutoscroll", function($app) {
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
                    var options = $app.interpolate(scope, alias.value);
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
    //! src/hb/directives/bridge.js
    //! pattern /hb\-bridge(\s|\=|>)/
    internal("hbd.bridge", [ "hb.directive", "debounce", "fromDashToCamel" ], function(directive, debounce, fromDashToCamel) {
        directive("hbBridge", function($app) {
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
                    function createUpdate(camelName) {
                        return function(newVal) {
                            scope[camelName] = newVal;
                            $apply();
                        };
                    }
                    for (i = 0; i < len; i += 1) {
                        attr = el.attributes[i];
                        name = attr.name || attr.nodeName || attr.localName;
                        camelName = fromDashToCamel(name);
                        value = el.getAttribute(name);
                        if (value && name.indexOf("ng-") !== 0 && name !== $app.name + "-id" && !$app.val(camelName)) {
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
    //! src/utils/formatters/fromDashToCamel.js
    define("fromDashToCamel", function() {
        return function(str) {
            return str.replace(/-([a-z])/g, function(g) {
                return g[1].toUpperCase();
            });
        };
    });
    //! src/hb/directives/class.js
    internal("hbd.class", [ "hb.directive", "query" ], function(directive, query) {
        directive("hbClass", function($app) {
            var $ = query;
            return {
                link: function(scope, el, alias) {
                    var $el = $(el);
                    scope.$watch(function() {
                        var classes = $app.interpolate(scope, alias.value);
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
    });
    //! src/utils/query/modify/addClass.js
    internal("query.addClass", [ "query" ], function(query) {
        query.fn.addClass = function(className) {
            var $el;
            this.each(function(index, el) {
                $el = query(el);
                if (!$el.hasClass(className)) {
                    el.className += " " + className;
                }
            });
            return this;
        };
    });
    //! src/utils/query/modify/hasClass.js
    internal("query.hasClass", [ "query" ], function(query) {
        query.fn.hasClass = function(className) {
            var returnVal = false;
            this.each(function(index, el) {
                if (!returnVal) {
                    if (el.classList) {
                        returnVal = el.classList.contains(className);
                    } else {
                        returnVal = new RegExp("(^| )" + className + "( |$)", "gi").test(el.className);
                    }
                    if (returnVal) {
                        return false;
                    }
                }
            });
            return returnVal;
        };
    });
    //! src/utils/query/modify/removeClass.js
    internal("query.removeClass", [ "query", "isDefined" ], function(query, isDefined) {
        query.fn.removeClass = function(className) {
            var $el;
            this.each(function(index, el) {
                $el = query(el);
                if (isDefined(className)) {
                    var newClass = " " + el.className.replace(/[\t\r\n]/g, " ") + " ";
                    if ($el.hasClass(className)) {
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
    //! src/hb/directives/cloak.js
    //! pattern /hb\-cloak(\s|\=|>)/
    internal("hbd.cloak", [ "hb.directive" ], function(directive) {
        directive("hbCloak", function($app) {
            return {
                link: function(scope, el, alias) {
                    scope.$on("hb::ready", function() {
                        el.removeAttribute(alias.name);
                    });
                }
            };
        });
    });
    //! src/hb/directives/directiveRepeat.js
    //! pattern /hb\-directive-repeat\=/
    internal("hbd.directiveRepeat", [ "hb.directive" ], function(directive) {
        directive("hbDirectiveRepeat", [ "$app", function($app) {
            return {
                link: [ "scope", "el", "alias", function(scope, el, alias) {
                    var itemProperty = scope.$eval(el.getAttribute("item-property"));
                    var scopeProperty = scope.$eval(el.getAttribute("scope-property")) || "model";
                    var typeMap = scope.$eval(el.getAttribute("type-map"));
                    var tpl = "";
                    if (el.children.length) {
                        tpl = el.children[0].outerHTML;
                        el.innerHTML = "";
                    }
                    function render(list, oldList) {
                        if (list && typeof list === "string" && list.length) {
                            list = [ list ];
                        }
                        if (list && list.length) {
                            var i = 0, len = Math.max(list.length || 0, el.children.length), child, s, dir, type, itemTpl;
                            while (i < len) {
                                child = el.children[i];
                                if (!child) {
                                    type = list[i];
                                    if (itemProperty) {
                                        type = type[itemProperty];
                                        if (typeMap) {
                                            type = typeMap[type] || typeMap.default;
                                        }
                                    } else if (typeMap && typeMap[type]) {
                                        type = typeMap[type];
                                    }
                                    dir = $app.val(type.split("-").join(""));
                                    if (dir) {
                                        dir = (dir.length ? dir[dir.length - 1] : dir)();
                                    } else {
                                        throw new Error(type + " is not registered.");
                                    }
                                    if (!dir.scope) {
                                        throw new Error(alias.name + " can only support inherited or isolated scope children.");
                                    }
                                    s = scope.$new();
                                    if (list[i] !== undefined && list[i] !== null && list[i] !== "") {
                                        s[scopeProperty] = list[i];
                                    }
                                    itemTpl = tpl ? tpl.replace(/<(\/?\w+)/g, "<" + type) : "<" + type + "></" + type + ">";
                                    child = $app.addChild(el, itemTpl, s);
                                }
                                if (list[i]) {
                                    s = child.scope;
                                    s[scopeProperty] = list[i];
                                    s.$index = i;
                                } else {
                                    child.scope.$destroy();
                                }
                                i += 1;
                            }
                        } else {
                            while (el.children.length) {
                                child = el.children[0];
                                if (child.scope && child.scope !== scope) {
                                    child.scope.$destroy();
                                }
                                el.removeChild(child);
                            }
                        }
                        scope.$emit("hbDirectiveRepeat::render");
                    }
                    scope.$watch(alias.value, render, true);
                    render(scope.$eval(alias.value));
                } ]
            };
        } ]);
    });
    //! src/hb/directives/disabled.js
    //! pattern /hb\-disabled(\s|\=|>)/
    internal("hbd.disabled", [ "hb.directive" ], function(directive) {
        directive("hbDisabled", function() {
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
    });
    //! src/hb/directives/events.js
    //! pattern /hb\-(click|mousedown|mouseup|keydown|keyup|touchstart|touchend|touchmove|animation\-start|animation\-end)\=/
    internal("hbd.events", [ "hb", "hb.val", "each" ], function(hb, val, each) {
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
        each(ANIME_EVENTS, function(eventName) {
            val("hb" + eventName, [ "$app", function($app) {
                return {
                    link: function(scope, el, alias) {
                        function handle(evt) {
                            if (evt.target.nodeName.toLowerCase() === "a") {
                                evt.preventDefault();
                            }
                            scope.$event = evt;
                            if (evt.target === el) {
                                $app.interpolate(scope, alias.value);
                                scope.$apply();
                            }
                            return false;
                        }
                        onAnime(el, eventName, handle);
                    }
                };
            } ], "event");
        });
        each(UI_EVENTS, function(eventName) {
            val("hb" + eventName.charAt(0).toUpperCase() + eventName.substr(1), [ "$app", function($app) {
                return {
                    link: function(scope, el, alias) {
                        function handle(evt) {
                            if (evt.target.nodeName.toLowerCase() === "a") {
                                evt.preventDefault();
                            }
                            scope.$event = evt;
                            $app.interpolate(scope, alias.value);
                            scope.$apply();
                            return false;
                        }
                        hb.on(el, eventName, handle);
                    }
                };
            } ], "event");
        });
    });
    //! src/hb/hb.js
    internal("hb", function() {
        var hb = {
            debug: {},
            plugins: {},
            filters: {},
            errors: {},
            directives: {}
        };
        var ON_STR = "on";
        hb.on = function(el, eventName, handler) {
            if (el.attachEvent) {
                el.attachEvent(ON_STR + eventName, el[eventName + handler]);
            } else {
                el.addEventListener(eventName, handler, false);
            }
        };
        hb.off = function(el, eventName, handler) {
            if (el.detachEvent) {
                el.detachEvent(ON_STR + eventName, el[eventName + handler]);
            } else {
                el.removeEventListener(eventName, handler, false);
            }
        };
        return hb;
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
    //! src/hb/directives/html.js
    //! pattern /hb\-html\=/
    internal("hbd.html", [ "hb.directive" ], function(directive) {
        directive("hbHtml", function() {
            return {
                link: function(scope, el, alias) {
                    scope.$watch(alias.value, function(newVal) {
                        el.innerHTML = newVal || "";
                    });
                }
            };
        });
    });
    //! src/hb/directives/ignore.js
    //! pattern /hb\-ignore(\s|\=|>)/
    internal("hbd.ignore", [ "hb.directive" ], function(directive) {
        directive("hbIgnore", function() {
            return {
                scope: true,
                link: function(scope, el, alias) {
                    scope.$ignore(true);
                }
            };
        });
    });
    //! src/hb/directives/model.js
    internal("hbd.model", [ "hb.directive", "resolve", "query", "hb.errors" ], function(directive, resolve, query, errors) {
        directive("hbModel", function() {
            var $ = query;
            return {
                link: function(scope, el, alias) {
                    var $el = $(el);
                    scope.$watch(alias.value, function(newVal) {
                        if (!el.hasOwnProperty("value")) {
                            throw errors.E13;
                        }
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
    //! src/hb/directives/repeat.js
    //! pattern /hb\-repeat\=/
    internal("hbd.repeat", [ "hb.directive", "each" ], function(directive, each) {
        directive("hbRepeat", function($app) {
            function trimStrings(str, index, list) {
                list[index] = str && str.trim();
            }
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
                        if (list && list.length) {
                            var i = 0, len = Math.max(list.length, el.children.length), child, s, data;
                            while (i < len) {
                                child = el.children[i];
                                if (!child) {
                                    data = {};
                                    data[itemName] = list[i];
                                    data.$index = i;
                                    child = $app.addChild(el, template, scope.$new(), data);
                                } else if (list[i]) {
                                    s = child.scope;
                                    s[itemName] = list[i];
                                    s.$index = i;
                                } else {
                                    child.scope.$destroy();
                                }
                                i += 1;
                            }
                        } else {
                            while (el.children.length) {
                                child = el.children[0];
                                if (child.scope && child.scope !== scope) {
                                    child.scope.$destroy();
                                }
                                el.removeChild(child);
                            }
                        }
                    }
                    scope.$watch(watch, render, true);
                }
            };
        });
    });
    //! src/hb/directives/show.js
    //! pattern /hb\-show\=/
    internal("hbd.show", [ "hb.directive" ], function(directive) {
        directive("hbShow", function() {
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
    });
    //! src/hb/directives/src.js
    //! pattern /hb\-src\=/
    internal("hbd.src", [ "hb.directive" ], function(directive) {
        directive("hbSrc", function() {
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
    });
    //! src/hb/directives/view.js
    //! pattern /hb\-view(=|\s+|>)/
    internal("hbd.view", [ "hb.directive" ], function(directive) {
        directive("hbView", function($app) {
            return {
                link: function(scope, el, alias) {
                    scope.title = "view";
                    function onChange(newVal) {
                        if (el.children.length) {
                            $app.removeChild(el.children[0]);
                        }
                        return $app.addChild(el, $app.val(newVal));
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
    });
    //! src/hb/errors/debug.js
    //! pattern /hb\-errors-debug\b/
    internal("hb.errors", function() {
        return {
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
            E10: "This element has already been compiled",
            E11: "Watch cannot have a function of null or undefined",
            E12: "parent element not found in %o",
            E13: "hb-model is only designed for input elements"
        };
    });
    //! src/hb/directives/attr/class.js
    internal("hb.attr.class", [ "hb.directive" ], function(directive) {
        directive("class", function() {
            return {
                link: [ "scope", "el", "$app", function(scope, el, $app) {
                    var len = el.classList.length, bindClasses = [];
                    for (var i = 0; i < len; i += 1) {
                        if (el.classList[i].indexOf($app.bindingMarkup[0]) !== -1) {
                            bindClasses.push({
                                bind: el.classList[i],
                                last: ""
                            });
                            el.classList.remove(el.classList[i]);
                            i -= 1;
                            len -= 1;
                        }
                    }
                    scope.$watch(function() {
                        var i, len = bindClasses.length, result, item;
                        for (i = 0; i < len; i += 1) {
                            item = bindClasses[i];
                            result = $app.parseBinds(scope, item.bind);
                            if (result !== item.last && item.last) {
                                el.classList.remove(item.last);
                            }
                            if (result) {
                                el.classList.add(result);
                            }
                            item.last = result;
                        }
                    });
                } ]
            };
        });
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
    //! src/hb/filters/timeAgo.js
    //! pattern /(\|timeAgo|\(\'timeAgo\'\))/
    internal("hbf.timeAgo", [ "hb.filter", "toTimeAgo" ], function(filter, toTimeAgo) {
        filter("timeAgo", function() {
            return function(date) {
                date = new Date(date);
                var ago = " ago";
                var returnVal = toTimeAgo(date);
                var interval = returnVal.interval;
                switch (returnVal.ago) {
                  case "d":
                    return interval + " days" + ago;

                  case "h":
                    return interval + " hours" + ago;

                  case "m":
                    return interval + " mins" + ago;

                  case "s":
                    return interval + " secs" + ago;

                  default:
                    return "just now";
                }
            };
        });
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
    //! src/hb/filters/upper.js
    //! pattern /(\|upper|\(\'upper\'\))/
    internal("hbf.upper", [ "hb.filter" ], function(filter) {
        filter("upper", function() {
            return function(val) {
                return (val + "").toUpperCase();
            };
        });
    });
    //! src/hb/module.js
    /*!
 import hbd.app
 import hbd.model
 import hbd.events
 import hb.directive
 */
    define("module", [ "hb", "hb.compiler", "hb.scope", "hb.val", "injector", "interpolator", "removeHTMLComments", "each", "ready", "hb.errors" ], function(hb, compiler, scope, val, injector, interpolator, removeHTMLComments, each, ready, errors) {
        var modules = {};
        function Module(name) {
            var self = this;
            self.name = name;
            var rootEl;
            var bootstraps = [];
            var _injector = this.injector = injector();
            var _interpolator = this.interpolator = interpolator(_injector);
            var _compiler = compiler(self);
            var compile = _compiler.compile;
            var interpolate = _interpolator.invoke;
            var injectorVal = _injector.val.bind(_injector);
            var rootScope = scope(interpolate);
            rootScope.$ignoreInterpolateErrors = true;
            injectorVal("$rootScope", rootScope);
            _injector.preProcessor = function(key, value) {
                if (value && value.isClass) {
                    return _injector.instantiate(value);
                }
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
                    val.init(this);
                    self.element(el);
                    while (bootstraps.length) {
                        _injector.invoke(bootstraps.shift(), self);
                    }
                    rootScope.$broadcast("hb::ready", self);
                    rootScope.$apply();
                }
            }
            function addChild(parentEl, htmlStr, overrideScope, data) {
                if (!htmlStr) {
                    return;
                }
                if (parentEl !== rootEl && rootEl.contains && !rootEl.contains(parentEl)) {
                    throw new Error(errors.MESSAGES.E12, rootEl);
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
                    return injectorVal(name);
                }
                ClassRef.isClass = true;
                return injectorVal(name, ClassRef);
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
            self.val = injectorVal;
            self.factory = injectorVal;
            self.service = service;
            self.template = injectorVal;
            self.parseBinds = function(scope, str) {
                return _compiler.parseBinds(str, scope);
            };
        }
        return function(name, forceNew) {
            if (!name) {
                throw errors.MESSAGES.E8;
            }
            var app = modules[name] = !forceNew && modules[name] || new Module(name);
            if (!app.val("$app")) {
                app.val("$app", app);
                app.val("$window", window);
                setTimeout(function() {
                    ready(function() {
                        var el = document.querySelector("[" + name + "-app]");
                        if (el) {
                            app.bootstrap(el);
                        }
                    });
                });
            }
            return app;
        };
    });
    //! src/utils/patterns/injector.js
    define("injector", [ "isFunction", "toArray" ], function(isFunction, toArray) {
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
            var injector = new Injector();
            if (arguments.length && isFunction(arguments[0])) {
                return injector.invoke.apply(injector, toArray(arguments));
            }
            return injector;
        };
    });
    //! src/utils/validators/isFunction.js
    define("isFunction", function() {
        var isFunction = function(val) {
            return typeof val === "function";
        };
        return isFunction;
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
    //! src/hb/utils/interpolator.js
    internal("interpolator", [ "each", "removeLineBreaks", "removeExtraSpaces" ], function(each, removeLineBreaks, removeExtraSpaces) {
        function Interpolator(injector) {
            var self = this;
            var ths = "this";
            var errorHandler = function(er, extraMessage, data) {
                if (window.console && console.warn) {
                    console.warn(extraMessage + "\n" + er.message + "\n" + (er.stack || er.stacktrace || er.backtrace), data);
                }
            };
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
                str = str.replace(/('|").*?\1/g, function(str) {
                    var result = "*" + c;
                    matches.push(str);
                    c += 1;
                    return result;
                });
                str = str.replace(/(\.?[a-zA-Z\$\_]+\w?\b)(?!\s?\:)/g, function(str) {
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
                if (scope[str] === undefined && scope.hasOwnProperty(str)) {
                    delete scope[str];
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
                if (str === null || str === undefined) {
                    return;
                }
                str = removeLineBreaks(str);
                str = removeExtraSpaces(str);
                if (!str) {
                    return;
                }
                filter = parseFilter(str, scope);
                if (filter) {
                    str = filter.str;
                }
                str = fixStrReferences(str, scope);
                result = new fn("var result; try { result = " + str + "; } catch(er) { result = er; } finally { return result; }").apply(scope);
                if (result) {
                    if (typeof result === "object" && (result.hasOwnProperty("stack") || result.hasOwnProperty("stacktrace") || result.hasOwnProperty("backtrace"))) {
                        if (!ignoreErrors) {
                            interpolateError(result, scope, str, errorHandler);
                        }
                        result = undefined;
                    }
                }
                return filter ? filter.filter(result) : result;
            }
            function trimStrings(str, index, list) {
                list[index] = str && str.trim();
            }
            self.invoke = interpolate;
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
    //! src/utils/formatters/removeHTMLComments.js
    define("removeHTMLComments", function() {
        var removeHTMLComments = function(htmlStr) {
            htmlStr = htmlStr + "";
            return htmlStr.replace(/<!--[\s\S]*?-->/g, "");
        };
        return removeHTMLComments;
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
    //! src/hb/plugins/mocks.js
    internal("hb.plugins.mocks", [ "hb" ], function(hb) {
        function Mocks($app) {
            var injector = $app.injector;
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
        return hb.plugins.mocks = function(module) {
            return module.mocks = module.mocks || module.injector.instantiate(Mocks);
        };
    });
    //! src/hb/plugins/router.js
    internal("hb.plugins.router", [ "hb" ], function(hb) {
        function Router($app, $rootScope, $window) {
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
                    $app.val(state.templateName, state.template);
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
            hb.on($window, "popstate", resolveUrl);
            hb.on($window, "hashchange", onHashCheck);
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
        return hb.plugins.router = function(module) {
            var result = module.router = module.router || module.injector.instantiate(Router);
            return module.injector.val("router", result);
        };
    });
    //! src/hb/scope.js
    internal("hb.scope", [ "hb.errors" ], function(errors) {
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
        function Scope(interpolate) {
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
            self.$interpolate = interpolate;
        }
        var scopePrototype = Scope.prototype;
        scopePrototype.$watch = function(watchFn, listenerFn, deep) {
            var self = this, watch, watchStr;
            if (!watchFn) {
                return;
            }
            if (typeof watchFn === "string") {
                watchStr = watchFn;
                watch = function() {
                    return self.$interpolate(self, watchFn, true);
                };
            } else {
                watch = watchFn;
            }
            var watcher = {
                expr: watchStr,
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
                            if (oldValue === initWatchVal) {
                                watcher.last = oldValue = undefined;
                            }
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
            var self = this;
            return self.$interpolate(locals || self, expr, true);
        };
        scopePrototype.$apply = function(expr) {
            var self = this;
            if (!self.$isIgnored()) {
                try {
                    self.$beginPhase("$apply");
                    if (expr) {
                        return self.$eval(expr);
                    }
                } finally {
                    self.$clearPhase();
                    self.$r.$digest();
                }
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
                child = new Scope(self.$interpolate);
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
        scopePrototype.$isIgnored = function() {
            var self = this;
            var ignored = self.$$ignore, scope = self;
            while (!ignored && scope.$p) {
                scope = scope.$p;
                ignored = scope.$$ignore;
            }
            return !!ignored;
        };
        scopePrototype.$ignore = function(enabled, childrenOnly) {
            var self = this;
            if (enabled !== undefined) {
                every(self.$c, function(scope) {
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
        return function(interpolate) {
            return new Scope(interpolate);
        };
    });
    //! src/hb/utils/compiler.js
    internal("hb.compiler", [ "each" ], function(each) {
        function Compiler($app) {
            var ID = $app.name + "-id";
            var injector = $app.injector;
            var interpolator = $app.interpolator;
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
                if (str && o) {
                    var regExp = new RegExp($app.bindingMarkup[0] + "(.*?)" + $app.bindingMarkup[1], "mg");
                    return str.replace(regExp, function(a, b) {
                        var r = interpolator.invoke(o, b.trim(), true);
                        return typeof r === "string" || typeof r === "number" ? r : typeof r === "object" ? JSON.stringify(r, null, 2) : "";
                    });
                }
                return str;
            }
            function invokeLink(directive, el) {
                var scope = $app.findScope(el);
                injector.invoke(directive.options.link, scope, {
                    scope: scope,
                    el: el,
                    alias: directive.alias
                });
            }
            function link(el, scope) {
                if (el) {
                    el.setAttribute(ID, scope.$id);
                    $app.elements[scope.$id] = el;
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
                    if (node.nodeValue.indexOf($app.bindingMarkup[0]) !== -1 && !hasNodeWatcher(scope, node)) {
                        var value = node.nodeValue;
                        scope.$watch(function() {
                            return parseBinds(value, scope);
                        }, function(newVal) {
                            if (newVal === undefined || newVal === null || newVal + "" === "NaN") {
                                newVal = "";
                            }
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
                    el.innerHTML = $app.val(typeof options.tplUrl === "string" ? options.tplUrl : injector.invoke(options.tplUrl, scope || el.scope, {
                        scope: scope || el.scope,
                        el: el,
                        alias: directive.alias
                    }));
                }
                if ($app.preLink) {
                    $app.preLink(el, directive);
                }
                links.push(directive);
            }
            self.link = link;
            self.compile = compile;
            self.parseBinds = parseBinds;
            self.preLink = null;
        }
        return function(module) {
            return new Compiler(module);
        };
    });
    //! src/hb/utils/directive.js
    internal("hb.directive", [ "hb.val" ], function(val) {
        return val;
    });
    //! src/hb/utils/filter.js
    internal("hb.filter", [ "hb.val" ], function(val) {
        return val;
    });
    //! src/hb/utils/service.js
    internal("hb.service", [ "hb.val" ], function(val) {
        return val;
    });
    //! src/hb/utils/val.js
    internal("hb.val", function() {
        var cache = {};
        var val = function(name, fn) {
            if (typeof fn === "undefined") {
                return cache[name];
            }
            cache[name] = fn;
        };
        val.init = function(app) {
            for (var name in cache) {
                app.val(name, cache[name]);
            }
        };
        return val;
    });
    //! .tmp_rest/rest.js
    define("rest", [ "dispatcher", "http", "http.mock" ], function(dispatcher, http, mock) {
        var rest = {};
        http.defaults.headers["Content-Type"] = "application/json;charset=UTF-8";
        dispatcher(rest);
        rest.mock = mock;
        rest.registerMock = mock.create;
        var resources = [ {
            methods: {
                login: {
                    type: "POST",
                    url: "/session/login"
                },
                logout: {
                    type: "GET",
                    url: "/session/logout"
                },
                getAuthUser: {
                    type: "GET",
                    url: "/session/me"
                },
                getIP: {
                    type: "GET",
                    url: "//api.ipify.org?format=jsonp"
                },
                getInvitee: {
                    type: "GET",
                    url: "sites/invite/:id"
                },
                getContactsDay0: {
                    type: "GET",
                    url: "contacts/new"
                },
                getContactsDay1: {
                    type: "GET",
                    url: "contacts/yesterday"
                },
                getContactsRecent: {
                    type: "GET",
                    url: "contacts/recent"
                },
                getContactsSlipping: {
                    type: "GET",
                    url: "contacts/slipping"
                }
            }
        }, {
            name: "persons"
        }, {
            name: "sites"
        }, {
            name: "visitors",
            methods: "get update"
        } ];
        for (var i = 0; i < resources.length; i += 1) {
            crudify(exports, resources[i], resources[i].methods);
        }
        return rest;
    });
    define("rest.crudify", [ "rest.resource", "defer", "http", "inflection" ], function(resource, defer, http, inflection) {
        var $baseUrl = "http://localhost:3000/v1";
        var $methods = {};
        var capitalize = function(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        };
        var trimSlashes = function(str) {
            return str.replace(/^\/?(.*?)\/?$/, "$1");
        };
        var singularizeCapitalize = function(str) {
            str = inflection.singularize(str) || str;
            str = capitalize(str);
            return str;
        };
        var requireParam = function(key, value) {
            if (typeof value === "undefined") {
                throw new Error("Expected param " + key + " to be defined: " + JSON.stringify(value));
            }
        };
        var requireId = function(value) {
            requireParam("id", value);
            var type = typeof value;
            if (!(type === "number" || type === "string")) {
                throw new Error('Expected param "id" to be "number" or "string": ' + JSON.stringify(value));
            }
        };
        var requireData = function(value) {
            requireParam("data", value);
            var type = typeof value;
            if (type !== "object") {
                throw new Error('Expected param "data" to be "object": ' + JSON.stringify(value));
            }
        };
        var onSuccess = function(response) {
            exports.fire("rest::success", response);
        };
        var onError = function(response) {
            exports.fire("rest::error", response);
        };
        $methods.all = function(name) {
            return function(params) {
                var deferred = defer();
                var payload = {};
                payload.credentials = true;
                payload.url = resource({
                    baseUrl: $baseUrl
                }).resource(name).params(params).toUrl();
                payload.success = deferred.resolve;
                payload.error = deferred.reject;
                http.get(payload);
                var promise = deferred.promise;
                promise.success(onSuccess);
                promise.error(onError);
                return promise;
            };
        };
        $methods.create = function(name) {
            return function(data, params) {
                requireData(data);
                var deferred = defer();
                var payload = {};
                payload.credentials = true;
                payload.url = resource({
                    baseUrl: $baseUrl
                }).resource(name).params(params).toUrl();
                payload.data = data;
                payload.success = deferred.resolve;
                payload.error = deferred.reject;
                http.post(payload);
                var promise = deferred.promise;
                promise.success(onSuccess);
                promise.error(onError);
                return promise;
            };
        };
        $methods.get = function(name) {
            return function(id, params) {
                requireId(id);
                var deferred = defer();
                var payload = {};
                payload.credentials = true;
                payload.url = resource({
                    baseUrl: $baseUrl
                }).resource(name, id).params(params).toUrl();
                payload.success = deferred.resolve;
                payload.error = deferred.reject;
                http.get(payload);
                var promise = deferred.promise;
                promise.success(onSuccess);
                promise.error(onError);
                return promise;
            };
        };
        $methods.update = function(name) {
            return function(id, data, params) {
                requireId(id);
                requireData(data);
                var deferred = defer();
                var payload = {};
                payload.credentials = true;
                payload.url = resource({
                    baseUrl: $baseUrl
                }).resource(name, id).params(params).toUrl();
                payload.data = data;
                payload.success = deferred.resolve;
                payload.error = deferred.reject;
                http.put(payload);
                var promise = deferred.promise;
                promise.success(onSuccess);
                promise.error(onError);
                return promise;
            };
        };
        $methods.delete = function(name) {
            return function(id, params) {
                requireId(id);
                var deferred = defer();
                var payload = {};
                payload.credentials = true;
                payload.url = resource({
                    baseUrl: $baseUrl
                }).resource(name, id).params(params).toUrl();
                payload.success = deferred.resolve;
                payload.error = deferred.reject;
                http.delete(payload);
                var promise = deferred.promise;
                promise.success(onSuccess);
                promise.error(onError);
                return promise;
            };
        };
        $methods.count = function(name) {
            return function(params) {
                var deferred = defer();
                var payload = {};
                payload.credentials = true;
                payload.url = resource({
                    baseUrl: $baseUrl
                }).resource(name).resource("count").params(params).toUrl();
                payload.success = deferred.resolve;
                payload.error = deferred.reject;
                http.get(payload);
                var promise = deferred.promise;
                promise.success(onSuccess);
                promise.error(onError);
                return promise;
            };
        };
        $methods.exists = function(name) {
            return function(params) {
                var deferred = defer();
                var payload = {};
                payload.credentials = true;
                payload.url = resource({
                    baseUrl: $baseUrl
                }).resource(name).resource("exists").params(params).toUrl();
                payload.success = deferred.resolve;
                payload.error = deferred.reject;
                http.get(payload);
                var promise = deferred.promise;
                promise.success(onSuccess);
                promise.error(onError);
                return promise;
            };
        };
        return function(target, options) {
            var methods = options.methods;
            if (!methods) {
                methods = "all create get update delete exists count";
            }
            if (typeof methods === "string") {
                methods = methods.split(" ");
            }
            var name = options.name;
            var i;
            var methodName;
            if (name) {
                name = trimSlashes(name);
                var baseUrl = trimSlashes(options.baseUrl || "");
                var resourceName = trimSlashes(options.url || "") || name;
                var url = baseUrl + "/" + resourceName;
                for (i = 0; i < methods.length; i++) {
                    methodName = methods[i];
                    if ($methods.hasOwnProperty(methodName)) {
                        if (options.syntax === "camel") {
                            switch (methodName) {
                              case "all":
                                if (options.methods && options.methods.hasOwnProperty(methodName)) {
                                    target[options.methods[methodName].name] = $methods[methodName](url);
                                } else {
                                    target["get" + capitalize(name)] = $methods[methodName](url);
                                }
                                break;

                              case "create":
                              case "update":
                              case "get":
                              case "delete":
                                if (options.methods && options.methods.hasOwnProperty(methodName)) {
                                    target[options.methods[methodName].name] = $methods[methodName](url);
                                } else {
                                    target[methodName + singularizeCapitalize(name)] = $methods[methodName](url);
                                }
                                break;

                              case "count":
                                if (options.methods && options.methods.hasOwnProperty(methodName)) {
                                    target[options.methods[methodName].name] = $methods[methodName](name);
                                } else {
                                    target["get" + singularizeCapitalize(name) + "Count"] = $methods.get(url);
                                }
                                break;

                              case "exists":
                                if (options.methods && options.methods.hasOwnProperty(methodName)) {
                                    target[options.methods[methodName].name] = $methods[methodName](name);
                                } else {
                                    target["get" + singularizeCapitalize(name) + "Exists"] = $methods.get(url);
                                }
                                break;

                              default:
                                target[methodName + capitalize(name)] = $methods[methodName](url);
                            }
                        } else {
                            target[name] = target[name] || {};
                            target[name][methodName] = $methods[methodName](url);
                        }
                    }
                }
            } else {
                var methodOptions, path;
                methods = options.methods;
                for (methodName in methods) {
                    if (methods.hasOwnProperty(methodName)) {
                        methodOptions = methods[methodName];
                        path = methodOptions.url || methodName;
                        switch (methodOptions.type.toUpperCase()) {
                          case "POST":
                            exports[methodName] = $methods.create(path);
                            break;

                          case "GET":
                            exports[methodName] = $methods.all(path);
                            break;

                          case "PUT":
                            exports[methodName] = $methods.update(path);
                            break;

                          case "DELETE":
                            exports[methodName] = $methods.delete(path);
                            break;
                        }
                    }
                }
            }
        };
    });
    define("rest.resource", [ "isArray" ], function(isArray) {
        function clone(hash) {
            return JSON.parse(JSON.stringify(hash));
        }
        function parseUrl(url, hash) {
            for (var e in hash) {
                if (hash.hasOwnProperty(e)) {
                    var regExp = new RegExp(":(" + e + ")\\b", "g");
                    if (regExp.test(url)) {
                        url = url.replace(regExp, hash[e]);
                        delete hash[e];
                    }
                }
            }
            return url;
        }
        function hashToSearch(hash) {
            var search = hash ? "?" : "";
            for (var k in hash) {
                if (isArray(hash[k])) {
                    for (var i = 0; i < hash[k].length; i++) {
                        search += search === "?" ? "" : "&";
                        search += encodeURIComponent(k) + "=" + encodeURIComponent(hash[k][i]);
                    }
                } else {
                    search += search === "?" ? "" : "&";
                    search += encodeURIComponent(k) + "=" + encodeURIComponent(hash[k]);
                }
            }
            return search;
        }
        function Resource(name, id) {
            this.$$id = id;
            if (typeof name === "string") {
                this.$$name = name.replace(/^\/?(.*?)\/?$/, "$1");
            }
            this.$$parent = null;
            this.$$params = null;
        }
        Resource.prototype.id = function(id) {
            if (id === undefined) {
                return this.$$id;
            }
            this.$$id = id;
            return this;
        };
        Resource.prototype.name = function(name) {
            if (name === undefined) {
                return this.$$name;
            }
            this.$$name = name;
            return this;
        };
        Resource.prototype.params = function(params) {
            if (arguments.length === 2) {
                if (typeof arguments[1] === "undefined") {
                    delete this.$$params[arguments[0]];
                } else {
                    this.$$params = this.$$params || {};
                    this.$$params[arguments[0]] = arguments[1];
                }
            } else if (typeof params === "object") {
                for (var e in params) {
                    if (params.hasOwnProperty(e)) {
                        if (typeof params[e] === "undefined") {
                            delete this.$$params[e];
                        } else {
                            this.$$params = this.$$params || {};
                            this.$$params[e] = params[e];
                        }
                    }
                }
            }
            return this;
        };
        Resource.prototype.resource = function(name, id) {
            var resource = new Resource(name, id);
            resource.$$parent = this;
            return resource;
        };
        Resource.prototype.$$toUrl = function() {
            var url = "";
            if (this.$$parent) {
                url += this.$$parent.$$toUrl();
            }
            if (typeof this.$$baseUrl === "string") {
                url = this.$$baseUrl;
            } else {
                if (this.$$name) {
                    url += "/" + this.$$name;
                }
                if (this.$$id) {
                    url += "/" + this.$$id;
                }
            }
            return url;
        };
        Resource.prototype.toUrl = function() {
            var url = this.$$toUrl();
            if (this.$$params) {
                var params = clone(this.$$params);
                url = parseUrl(url, params);
                url += hashToSearch(params);
            }
            return url;
        };
        return function(name, id) {
            var resource;
            if (typeof name === "object") {
                resource = new Resource(name.name, name.id);
                resource.$$baseUrl = name.baseUrl;
            } else {
                resource = new Resource(name, id);
            }
            return resource;
        };
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
    //! src/utils/ajax/http-mock.js
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
                var mock = matchMock(options), response, onload, warning = warn;
                if (options.warn) {
                    warning = options.warn;
                }
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
                        warning("Invalid options object for http.");
                    }
                }
                if (mock && mock.pre) {
                    mock.pre(preNext, options, http);
                    return true;
                }
                warning("No adapter found for " + options.url + ".");
                return false;
            }
        };
        return result;
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
    //! src/utils/formatters/inflection.js
    define("inflection", function() {
        var inflections = {
            plurals: [],
            singulars: [],
            uncountables: [],
            humans: []
        };
        var PLURALS = inflections.plurals, SINGULARS = inflections.singulars, UNCOUNTABLES = inflections.uncountables, HUMANS = inflections.humans;
        var plural = function(rule, replacement) {
            inflections.plurals.unshift([ rule, replacement ]);
        };
        var singular = function(rule, replacement) {
            inflections.singulars.unshift([ rule, replacement ]);
        };
        var uncountable = function(word) {
            inflections.uncountables.unshift(word);
        };
        var irregular = function(s, p) {
            if (s.substr(0, 1).toUpperCase() === p.substr(0, 1).toUpperCase()) {
                plural(new RegExp("(" + s.substr(0, 1) + ")" + s.substr(1) + "$", "i"), "$1" + p.substr(1));
                plural(new RegExp("(" + p.substr(0, 1) + ")" + p.substr(1) + "$", "i"), "$1" + p.substr(1));
                singular(new RegExp("(" + p.substr(0, 1) + ")" + p.substr(1) + "$", "i"), "$1" + s.substr(1));
            } else {
                plural(new RegExp(s.substr(0, 1).toUpperCase() + s.substr(1) + "$"), p.substr(0, 1).toUpperCase() + p.substr(1));
                plural(new RegExp(s.substr(0, 1).toLowerCase() + s.substr(1) + "$"), p.substr(0, 1).toLowerCase() + p.substr(1));
                plural(new RegExp(p.substr(0, 1).toUpperCase() + p.substr(1) + "$"), p.substr(0, 1).toUpperCase() + p.substr(1));
                plural(new RegExp(p.substr(0, 1).toLowerCase() + p.substr(1) + "$"), p.substr(0, 1).toLowerCase() + p.substr(1));
                singular(new RegExp(p.substr(0, 1).toUpperCase() + p.substr(1) + "$"), s.substr(0, 1).toUpperCase() + s.substr(1));
                singular(new RegExp(p.substr(0, 1).toLowerCase() + p.substr(1) + "$"), s.substr(0, 1).toLowerCase() + s.substr(1));
            }
        };
        var human = function(rule, replacement) {
            inflections.humans.push([ rule, replacement ]);
        };
        plural(/$/, "s");
        plural(/s$/i, "s");
        plural(/(ax|test)is$/i, "$1es");
        plural(/(octop|vir)us$/i, "$1i");
        plural(/(alias|status)$/i, "$1es");
        plural(/(bu)s$/i, "$1ses");
        plural(/(buffal|tomat)o$/i, "$1oes");
        plural(/([ti])um$/i, "$1a");
        plural(/sis$/i, "ses");
        plural(/(?:([^f])fe|([lr])f)$/i, "$1$2ves");
        plural(/(hive)$/i, "$1s");
        plural(/([^aeiouy]|qu)y$/i, "$1ies");
        plural(/(x|ch|ss|sh)$/i, "$1es");
        plural(/(matr|vert|ind)(?:ix|ex)$/i, "$1ices");
        plural(/([m|l])ouse$/i, "$1ice");
        plural(/^(ox)$/i, "$1en");
        plural(/(quiz)$/i, "$1zes");
        singular(/s$/i, "");
        singular(/(n)ews$/i, "$1ews");
        singular(/([ti])a$/i, "$1um");
        singular(/((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$/i, "$1$2sis");
        singular(/(^analy)ses$/i, "$1sis");
        singular(/([^f])ves$/i, "$1fe");
        singular(/(hive)s$/i, "$1");
        singular(/(tive)s$/i, "$1");
        singular(/([lr])ves$/i, "$1f");
        singular(/([^aeiouy]|qu)ies$/i, "$1y");
        singular(/(s)eries$/i, "$1eries");
        singular(/(m)ovies$/i, "$1ovie");
        singular(/(x|ch|ss|sh)es$/i, "$1");
        singular(/([m|l])ice$/i, "$1ouse");
        singular(/(bus)es$/i, "$1");
        singular(/(o)es$/i, "$1");
        singular(/(shoe)s$/i, "$1");
        singular(/(cris|ax|test)es$/i, "$1is");
        singular(/(octop|vir)i$/i, "$1us");
        singular(/(alias|status)es$/i, "$1");
        singular(/^(ox)en/i, "$1");
        singular(/(vert|ind)ices$/i, "$1ex");
        singular(/(matr)ices$/i, "$1ix");
        singular(/(quiz)zes$/i, "$1");
        singular(/(database)s$/i, "$1");
        irregular("person", "people");
        irregular("man", "men");
        irregular("child", "children");
        irregular("sex", "sexes");
        irregular("move", "moves");
        irregular("cow", "kine");
        uncountable("equipment");
        uncountable("information");
        uncountable("rice");
        uncountable("money");
        uncountable("species");
        uncountable("series");
        uncountable("fish");
        uncountable("sheep");
        uncountable("jeans");
        var pluralize = function(word) {
            var wlc = word.toLowerCase();
            var i;
            for (i = 0; i < UNCOUNTABLES.length; i++) {
                var uncountable = UNCOUNTABLES[i];
                if (wlc === uncountable) {
                    return word;
                }
            }
            for (i = 0; i < PLURALS.length; i++) {
                var rule = PLURALS[i][0], replacement = PLURALS[i][1];
                if (rule.test(word)) {
                    return word.replace(rule, replacement);
                }
            }
        };
        var singularize = function(word) {
            var wlc = word.toLowerCase();
            var i;
            for (i = 0; i < UNCOUNTABLES.length; i++) {
                var uncountable = UNCOUNTABLES[i];
                if (wlc === uncountable) {
                    return word;
                }
            }
            for (i = 0; i < SINGULARS.length; i++) {
                var rule = SINGULARS[i][0], replacement = SINGULARS[i][1];
                if (rule.test(word)) {
                    return word.replace(rule, replacement);
                }
            }
        };
        var humanize = function(word) {
            for (var i = 0; i < HUMANS.length; i++) {
                var rule = HUMANS[i][0], replacement = HUMANS[i][1];
                if (rule.test(word)) {
                    word = word.replace(rule, replacement);
                }
            }
            return camelToTerms(word, " ").toLowerCase();
        };
        var camelToTerms = function(word, delim) {
            delim = delim || " ";
            var replacement = "$1" + delim + "$2";
            return word.replace(/([A-Z]+)([A-Z][a-z])/g, replacement).replace(/([a-z\d])([A-Z])/g, replacement);
        };
        var underscore = function(word) {
            return camelToTerms(word, "_").toLowerCase();
        };
        var dasherize = function(word) {
            return camelToTerms(word, "-").toLowerCase();
        };
        return {
            pluralize: pluralize,
            singularize: singularize,
            humanize: humanize,
            camelToTerms: camelToTerms,
            underscore: underscore,
            dasherize: dasherize
        };
    });
    for (var name in cache) {
        resolve(name, cache[name]);
    }
})(this["hb"] || {}, function() {
    return this;
}());