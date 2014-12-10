(function(exports, global) {
    global["hb"] = exports;
    var compiler = function() {
        function Compiler(module) {
            var ID = module.name + "-id";
            var each = utils.each;
            var injector = module.injector;
            var interpolator = module.interpolator;
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
                var attrs = el.attributes;
                var attr;
                var returnVal = [];
                var i = 0, len = attrs.length;
                while (i < len) {
                    attr = attrs[i];
                    var name = attr ? attr.name.split("-").join("") : "";
                    var directiveFn = injector.get(name);
                    if (directiveFn) {
                        returnVal.push({
                            options: injector.invoke(directiveFn),
                            alias: {
                                name: attr.name,
                                value: el.getAttribute(attr.name)
                            }
                        });
                    }
                    i += 1;
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
                each(el.childNodes, removeComments, el);
                var directives = findDirectives(el), links = [];
                if (directives && directives.length) {
                    each(directives, compileDirective, el, scope, links);
                    each(links, invokeLink, el);
                }
                if (el) {
                    scope = el.scope || scope;
                    var i = 0, len = el.children.length;
                    while (i < len) {
                        compile(el.children[i], scope);
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
                if (!el.scope && directive.options.scope) {
                    createChildScope(parentScope, el, typeof directive.options.scope === "object", directive.options.scope);
                }
                links.push(directive);
            }
            this.link = link;
            this.compile = compile;
        }
        return function(module) {
            return new Compiler(module);
        };
    }();
    var directives = {};
    directives.app = function(module) {
        module.directive(module.name + "App", function() {
            return {
                link: function(scope, el) {}
            };
        });
        utils.browser.ready(function() {
            var el = document.querySelector("[" + module.name + "-app]");
            if (el) {
                module.bootstrap(el);
            }
        });
    };
    directives.autoscroll = function(module) {
        module.directive("hbAutoscroll", function() {
            var $ = utils.query;
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
    directives.class = function(module) {
        module.directive("hbClass", function() {
            var $ = utils.query;
            return {
                link: function(scope, el, alias) {
                    var $el = $(el);
                    scope.$watch(function() {
                        var classes = module.interpolate(scope, alias.value);
                        for (var e in classes) {
                            if (classes[e]) {
                                $el.addClass(e);
                            } else {
                                $el.removeClass(e);
                            }
                        }
                    });
                }
            };
        });
    };
    directives.cloak = function(module) {
        module.directive("hbCloak", function() {
            return {
                link: function(scope, el, alias) {
                    el.removeAttribute(alias.name);
                }
            };
        });
    };
    directives.disabled = function(module) {
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
    (function() {
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
        directives.events = function(module) {
            function setup(eventName, handle) {
                return function directive() {
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
                            handle(el, eventName, handle);
                        }
                    };
                };
            }
            utils.each(ANIME_EVENTS, function(eventName) {
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
            utils.each(UI_EVENTS, function(eventName) {
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
                            exports.on(el, eventName, handle);
                        }
                    };
                }, "event");
            });
        };
    })();
    directives.html = function(module) {
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
    directives.ignore = function(module) {
        module.directive("hbIgnore", function() {
            return {
                scope: true,
                link: function(scope, el, alias) {
                    scope.$ignore(true);
                }
            };
        });
    };
    directives.model = function(module) {
        module.directive("hbModel", function() {
            var $ = utils.query;
            return {
                link: function(scope, el, alias) {
                    var $el = $(el);
                    scope.$watch(alias.value, function(newVal) {
                        el.value = newVal;
                    });
                    function eventHandler(evt) {
                        utils.parsers.resolve(scope, alias.value, el.value);
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
    directives.repeat = function(module) {
        function trimStrings(str, index, list) {
            list[index] = str && str.trim();
        }
        module.directive("hbRepeat", function() {
            return {
                scope: true,
                link: function(scope, el, alias) {
                    var template = el.children[0].outerHTML;
                    el.removeChild(el.children[0]);
                    var statement = alias.value;
                    statement = utils.each.call({
                        all: true
                    }, statement.split(/\s+in\s+/), trimStrings);
                    var itemName = statement[0], watch = statement[1];
                    function render(list, oldList) {
                        var i = 0, len = Math.max(list.length, el.children.length), child, s;
                        while (i < len) {
                            child = el.children[i];
                            if (!child) {
                                child = module.addChild(el, template);
                            }
                            if (list[i]) {
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
    directives.show = function(module) {
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
    directives.src = function(module) {
        module.directive("hbSrc", function() {
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
    directives.view = function(module) {
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
    var errors = {};
    errors.MESSAGES = {
        E1: "Trying to assign multiple scopes to the same dom element is not permitted.",
        E2: "Unable to find element",
        E3: "Exceeded max digests of ",
        E4: "parent element not found in %o",
        E5: "property is not of type object",
        E6a: 'Error evaluating: "',
        E6b: '" against %o',
        E7: "$digest already in progress.",
        E8: "Name required to instantiate module"
    };
    var filters = {};
    filters.timeAgo = function(module) {
        module.filter("timeAgo", function() {
            return function(date) {
                date = new Date(date);
                var ago = " ago";
                var returnVal = utils.formatters.toTimeAgo(date);
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
    };
    var injector = function() {
        function Injector() {
            var self = this, registered = {}, injector = {};
            function prepareArgs(fn, locals) {
                if (!fn.$inject) {
                    fn.$inject = $getInjectionArgs(fn);
                }
                var args = fn.$inject ? fn.$inject.slice() : [];
                utils.each.call({
                    all: true
                }, args, getInjection, locals);
                return args;
            }
            function functionOrArray(fn) {
                var f;
                if (fn instanceof Array) {
                    f = fn.pop();
                    f.$inject = fn;
                    fn = f;
                }
                return fn;
            }
            function invoke(fn, scope, locals) {
                fn = functionOrArray(fn);
                return fn.apply(scope, prepareArgs(fn, locals));
            }
            function instantiate(fn, locals) {
                fn = functionOrArray(fn);
                return construct(fn, prepareArgs(fn, locals));
            }
            function construct(constructor, args) {
                function F() {
                    return constructor.apply(this, args);
                }
                F.prototype = constructor.prototype;
                return new F();
            }
            function $getInjectionArgs(fn) {
                var str = fn.toString();
                return str.match(/\(.*\)/)[0].match(/([\$\w])+/gm);
            }
            function getInjection(type, index, list, locals) {
                var result, cacheValue = self.get(type);
                if (cacheValue !== undefined) {
                    result = cacheValue;
                } else if (locals && locals[type]) {
                    result = locals[type];
                }
                list[index] = result;
            }
            function _get(name) {
                var value = registered[name.toLowerCase()];
                if (typeof value === "function") {
                    if (value.isClass) {
                        if (!value.instance) {
                            value.instance = instantiate(value);
                        }
                        return value.instance;
                    }
                }
                return value;
            }
            function _set(name, value) {
                return registered[name.toLowerCase()] = value;
            }
            self.set = _set;
            self.get = _get;
            self.invoke = invoke;
            self.instantiate = instantiate;
        }
        return function() {
            return new Injector();
        };
    }();
    var interpolator = function() {
        function Interpolator(injector) {
            var self = this;
            var ths = "this";
            var each = utils.each;
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
                    var filterName = parts[1].shift(), filter = injector.get(filterName), args;
                    if (!filter) {
                        return parts[0];
                    } else {
                        args = parts[1];
                    }
                    each(args, injector.getInjection, scope);
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
                str = utils.formatters.stripLineBreaks(str);
                str = utils.formatters.stripExtraSpaces(str);
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
    }();
    var module = function() {
        var modules = {};
        function Module(name) {
            var self = this;
            self.name = name;
            var rootEl;
            var rootScope = exports.scope();
            var bootstraps = [];
            var injector = this.injector = exports.injector();
            var interpolator = this.interpolator = exports.interpolator(injector);
            var compiler = exports.compiler(self);
            var compile = compiler.compile;
            var interpolate = interpolator.exec;
            var injectorGet = injector.get;
            var injectorSet = injector.set;
            injector.set("$rootScope", rootScope);
            rootScope.interpolate = function(scope, exp, data) {
                if (typeof exp === "function") {
                    return exp(scope, data);
                }
                return interpolate(scope, exp);
            };
            function _val(name, value) {
                if (name && value === undefined) {
                    return injectorGet(name);
                }
                return injectorSet(name, value);
            }
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
            function addChild(parentEl, htmlStr) {
                if (!htmlStr) {
                    return;
                }
                if (parentEl !== rootEl && rootEl.contains && !rootEl.contains(parentEl)) {
                    throw new Error("parent element not found in %o", rootEl);
                }
                parentEl.insertAdjacentHTML("beforeend", utils.formatters.stripHTMLComments(htmlStr));
                var scope = findScope(parentEl);
                var child = parentEl.children[parentEl.children.length - 1];
                compiler.link(child, scope.$new());
                compile(child, scope);
                return child;
            }
            function removeChild(childEl) {
                var list;
                if (childEl.scope) {
                    childEl.scope.$destroy();
                } else {
                    list = childEl.querySelectorAll(name + "-id");
                    utils.each(list, removeChild);
                }
                childEl.remove();
            }
            function element(el) {
                if (typeof el !== "undefined") {
                    rootEl = el;
                    compiler.link(rootEl, rootScope);
                    compile(rootEl, rootScope);
                }
                return rootEl;
            }
            function service(name, ClassRef) {
                if (ClassRef === undefined) {
                    return _val(name);
                }
                ClassRef.isClass = true;
                return _val(name, ClassRef);
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
                use.apply(self, [ directives, namesStr ]);
            }
            function usePlugins(namesStr) {
                use.apply(self, [ plugins, namesStr ]);
            }
            function useFilters(namesStr) {
                use.apply(self, [ filters, namesStr ]);
            }
            function ready() {
                while (bootstraps.length) {
                    injector.invoke(bootstraps.shift(), self);
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
            self.interpolate = interpolate;
            self.element = element;
            self.val = _val;
            self.directive = _val;
            self.filter = _val;
            self.template = _val;
            self.useDirectives = useDirectives;
            self.usePlugins = usePlugins;
            self.useFilters = useFilters;
            self.service = service;
            self.ready = ready;
        }
        return function(name, forceNew) {
            if (!name) {
                throw exports.errors.MESSAGES.E8;
            }
            var module = modules[name] = !forceNew && modules[name] || new Module(name);
            if (!module.injector.get("module")) {
                module.injector.set("module", module);
                module.injector.set("$window", window);
            }
            return module;
        };
    }();
    (function(exp) {
        var ON_STR = "on";
        function on(el, eventName, handler) {
            if (el.attachEvent) {
                el.attachEvent(ON_STR + eventName, el[eventName + handler]);
            } else {
                el.addEventListener(eventName, handler, false);
            }
        }
        function off(el, eventName, handler) {
            if (el.detachEvent) {
                el.detachEvent(ON_STR + eventName, el[eventName + handler]);
            } else {
                el.removeEventListener(eventName, handler, false);
            }
        }
        exp.on = on;
        exp.off = off;
    })(exports);
    var plugins = {};
    plugins.http = function(module) {
        return module.injector.set("http", utils.ajax.http);
    };
    (function() {
        function Mocks(module) {
            var injector = module.injector;
            injector.set("$window", new Win());
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
        plugins.mocks = function(module) {
            return module.mocks = module.mocks || module.injector.instantiate(Mocks);
        };
    })();
    (function() {
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
            exports.on($window, "popstate", resolveUrl);
            exports.on($window, "hashchange", onHashCheck);
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
        plugins.router = function(module) {
            var result = module.router = module.router || module.injector.instantiate(Router);
            return module.injector.set("router", result);
        };
    })();
    var scope = function() {
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
    }();
    var utils = {};
    utils.ajax = {};
    utils.ajax.http = function() {
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
    }();
    utils.browser = {};
    (function(global) {
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
        utils.browser.isMobile = instantiate();
    })(this);
    (function() {
        var callbacks = [], win = window, doc = document, ADD_EVENT_LISTENER = "addEventListener", REMOVE_EVENT_LISTENER = "removeEventListener", ATTACH_EVENT = "attachEvent", DETACH_EVENT = "detachEvent", DOM_CONTENT_LOADED = "DOMContentLoaded", ON_READY_STATE_CHANGE = "onreadystatechange", COMPLETE = "complete", READY_STATE = "readyState";
        utils.browser.ready = function(callback) {
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
    utils.data = {};
    utils.data.array = {};
    utils.data.array.sort = function() {
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
    }();
    utils.data.diff = function(source, target) {
        var returnVal = {}, dateStr;
        for (var name in target) {
            if (name in source) {
                if (utils.validators.isDate(target[name])) {
                    dateStr = utils.validators.isDate(source[name]) ? source[name].toISOString() : source[name];
                    if (target[name].toISOString() !== dateStr) {
                        returnVal[name] = target[name];
                    }
                } else if (utils.validators.isObject(target[name]) && !utils.validators.isArray(target[name])) {
                    var diff = utils.data.diff(source[name], target[name]);
                    if (!utils.validators.isEmpty(diff)) {
                        returnVal[name] = diff;
                    }
                } else if (!utils.validators.isEqual(source[name], target[name])) {
                    returnVal[name] = target[name];
                }
            } else {
                returnVal[name] = target[name];
            }
        }
        if (utils.validators.isEmpty(returnVal)) {
            return null;
        }
        return returnVal;
    };
    (function() {
        function applyMethod(scope, method, item, index, list, extraArgs, all) {
            var args = all ? [ item, index, list ] : [ item ];
            return method.apply(scope, args.concat(extraArgs));
        }
        utils.each = function(list, method) {
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
    })();
    utils.formatters = {};
    utils.formatters.stripExtraSpaces = function(str) {
        str = str + "";
        return str.replace(/(\r\n|\n|\r)/gm, "");
    };
    utils.formatters.stripHTMLComments = function(htmlStr) {
        htmlStr = htmlStr + "";
        return htmlStr.replace(/<!--[\s\S]*?-->/g, "");
    };
    utils.formatters.stripLineBreaks = function(str) {
        str = str + "";
        return str.replace(/\s+/g, " ");
    };
    utils.formatters.toTimeAgo = function(date) {
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
    utils.parsers = {};
    utils.parsers.htmlify = function() {
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
    utils.parsers.resolve = function(object, path, value) {
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
    };
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
        utils.query = function(selector, context) {
            for (var n in utils.query.fn) {
                if (utils.query.fn.hasOwnProperty(n)) {
                    queryPrototype[n] = utils.query.fn[n];
                    delete utils.query.fn[n];
                }
            }
            return new Query(selector, context);
        };
        utils.query.fn = {};
    })();
    utils.query.fn.bind = utils.query.fn.on = function(events, handler) {
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
    utils.query.fn.unbind = utils.query.fn.off = function(events, handler) {
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
    utils.query.fn.unbindAll = function(event) {
        var scope = this;
        this.each(function(index, el) {
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
        return this;
    };
    utils.query.fn.addClass = function(className) {
        var scope = this;
        this.each(function(index, el) {
            if (!scope.hasClass(el, className)) {
                el.className += " " + className;
            }
        });
        return this;
    };
    utils.query.fn.hasClass = function(el, className) {
        if (el.classList) {
            return el.classList.contains(className);
        }
        return new RegExp("(^| )" + className + "( |$)", "gi").test(el.className);
    };
    utils.query.fn.removeClass = function(className) {
        var scope = this;
        this.each(function(index, el) {
            if (utils.validators.isDefined(className)) {
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
    utils.query.fn.css = function(prop, value) {
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
    utils.validators = {};
    utils.validators.isArray = function(val) {
        return val ? !!val.isArray : false;
    };
    utils.validators.isDate = function(val) {
        return val instanceof Date;
    };
    utils.validators.isDefined = function(val) {
        return typeof val !== "undefined";
    };
    utils.validators.isEmpty = function(val) {
        if (val === null) {
            return true;
        }
        if (utils.validators.isString(val)) {
            return val === "";
        }
        if (utils.validators.isArray(val)) {
            return val.length === 0;
        }
        if (utils.validators.isObject(val)) {
            for (var e in val) {
                return false;
            }
            return true;
        }
        return false;
    };
    utils.validators.isEqual = function(src, target, deep) {
        var srcKeys, targetKeys, srcLen, targetLen, i, s, t;
        if (typeof src === "string" || typeof src === "number" || typeof src === "boolean") {
            return src === target;
        }
        srcKeys = Object.keys(src);
        targetKeys = Object.keys(target);
        srcLen = srcKeys.length;
        targetLen = targetKeys.length;
        if (srcLen !== targetLen) {
            console.log("different keys ", srcLen - targetLen);
            return false;
        }
        if (deep) {
            for (i = 0; i < srcLen; i += 1) {
                s = src[srcKeys[i]];
                t = src[targetKeys[i]];
                if (typeof s === "object" && t && !utils.validators.isEqual(src[srcKeys[i]], target[srcKeys[i]], deep)) {
                    return false;
                }
            }
        }
        return true;
    };
    utils.validators.isObject = function(val) {
        return val !== null && typeof val === "object";
    };
    utils.validators.isString = function(val) {
        return typeof val === "string";
    };
    exports["compiler"] = compiler;
    exports["directives"] = directives;
    exports["errors"] = errors;
    exports["filters"] = filters;
    exports["injector"] = injector;
    exports["interpolator"] = interpolator;
    exports["module"] = module;
    exports["plugins"] = plugins;
    exports["scope"] = scope;
    exports["utils"] = utils;
})({}, function() {
    return this;
}());