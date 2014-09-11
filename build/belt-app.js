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
    (function() {
        "use strict";
        function Compiler(module, injector, interpolator) {
            var ID = module.name + "-id";
            var each = helpers.each;
            var elements = module.elements;
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
            function parseBinds(str, o) {
                if (str) {
                    return str.replace(/{{([^{}]*)}}/g, function(a, b) {
                        var r = interpolator.exec(o, b.trim());
                        return typeof r === "string" || typeof r === "number" ? r : "";
                    });
                }
                return str;
            }
            function invokeLink(directive, index, list, el) {
                var scope = module.findScope(el);
                injector.invoke(directive.link, scope, {
                    scope: scope,
                    el: el,
                    alias: directive.alias
                });
            }
            function link(scope, el) {
                if (el) {
                    el.setAttribute(ID, scope.$id);
                    elements[scope.$id] = el;
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
                            fn: directiveFn,
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
                link(scope, el);
                extend(scope, data);
                return scope;
            }
            function createWatchers(node, index, list, scope) {
                if (node.nodeType === 3) {
                    if (node.nodeValue.indexOf("{") !== -1 && !hasNodeWatcher(scope, node)) {
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
                    scope = module.findScope(el);
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
            function compileDirective(directive, index, list, el, parentScope, links) {
                var elScope = module.findScope(el);
                var $directive;
                var id = el.getAttribute(ID);
                $directive = injector.invoke(directive.fn, parentScope);
                $directive.alias = directive.alias;
                if ($directive.scope && parentScope === elScope) {
                    if (id) {
                        throw new Error("Trying to assign multiple scopes to the same dom element is not permitted.");
                    }
                    createChildScope(parentScope, el, $directive.scope === true, $directive.scope);
                }
                links.push($directive);
            }
            this.link = link;
            this.compile = compile;
        }
        app.compiler = function(module, injector, interpolator) {
            return new Compiler(module, injector, interpolator);
        };
    })();
    app.debug = {};
    (function() {
        app.debug.scopeDebugger = function() {
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
            return api;
        }();
    })();
    app.directives = function(module, directives) {
        var $d = app.directives;
        var name;
        var list = directives.split(" ");
        for (var e in list) {
            name = list[e];
            if ($d.hasOwnProperty(name)) {
                $d[name](module);
            }
        }
    };
    app.directives.app = function(module) {
        console.log("we are here");
        module.directive(module.name + "app", function(module) {
            return {
                link: function(scope, el) {
                    console.log("app::init", module.name);
                }
            };
        });
        browser.ready(function() {
            var el = document.querySelector("[" + module.name + "-app]");
            if (el) {
                module.bootstrap(el);
            }
        });
    };
    app.directives.class = function(module) {
        module.directive(module.name + "class", function(module) {
            var $ = query;
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
    app.directives.cloak = function(module) {
        module.directive(module.name + "cloak", function() {
            return {
                link: function(scope, el, alias) {
                    el.removeAttribute(alias.name);
                }
            };
        });
    };
    app.directives.disabled = function(module) {
        module.directive(module.name + "disabled", function() {
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
                module.set(module.name + eventName, function() {
                    return {
                        link: function(scope, el, alias) {
                            function handle(evt) {
                                if (evt.target.nodeName.toLowerCase() === "a") {
                                    evt.preventDefault();
                                }
                                module.interpolate(scope, alias.value);
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
    app.directives.html = function(module) {
        module.directive(module.name + "html", function() {
            return {
                link: function(scope, el, alias) {
                    scope.$watch(alias.value, function(newVal) {
                        el.innerHTML = newVal || "";
                    });
                }
            };
        });
    };
    app.directives.model = function(module) {
        console.log("model", module.name + "model");
        module.directive(module.name + "model", function() {
            var $ = query;
            return {
                link: function(scope, el, alias) {
                    var $el = $(el);
                    scope.$watch(alias.value, function(newVal) {
                        el.value = newVal;
                    });
                    function eventHandler(evt) {
                        scope.$resolve(alias.value, el.value);
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
    app.directives.show = function(module) {
        module.directive(module.name + "show", function() {
            return {
                scope: true,
                link: function(scope, el, alias) {
                    var enabled = true;
                    function enable() {
                        if (!enabled) {
                            enabled = true;
                            moveListeners(scope.$$$listeners, scope.$$listeners);
                            scope.$$childHead = scope.$$$childHead;
                            scope.$$childTail = scope.$$$childTail;
                            el.style.display = null;
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
                    scope.$watch(alias.value, function(newVal, oldVal) {
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
    };
    app.directives.src = function(module) {
        module.directive(module.name + "src", function() {
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
    app.directives.view = function(module) {
        module.directive(module.name + "view", function(module) {
            return {
                link: function(scope, el, alias) {
                    scope.$watch(alias.value, function(newVal) {
                        if (el.children.length) {
                            module.removeChild(el.children[0]);
                        }
                        var view = module.view(newVal);
                        module.addChild(el, view);
                    });
                }
            };
        });
    };
    app.errors = {};
    app.filters = function(module, filters) {
        var $d = app.filters;
        var name;
        var list = filters.split(" ");
        for (var e in list) {
            name = list[e];
            if ($d.hasOwnProperty(name)) {
                $d[name](module);
            }
        }
    };
    app.filters.timeAgo = function(module) {
        module.filter("timeAgo", function() {
            return function(date) {
                var ago = " ago";
                var returnVal = formatters.toTimeAgo(date);
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
    (function() {
        function Injector() {
            var self = this, registered = {}, injector = {};
            function prepareArgs(fn, locals) {
                var f;
                if (fn instanceof Array) {
                    f = fn.pop();
                    f.$inject = fn;
                    fn = f;
                }
                if (!fn.$inject) {
                    fn.$inject = $getInjectionArgs(fn);
                }
                var args = fn.$inject ? fn.$inject.slice() : [];
                helpers.each(args, getInjection, locals);
                return args;
            }
            function invoke(fn, scope, locals) {
                return fn.apply(scope, prepareArgs(fn, locals));
            }
            function instantiate(fn, locals) {
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
                return registered[name.toLowerCase()];
            }
            function _set(name, fn) {
                registered[name.toLowerCase()] = fn;
            }
            self.getInjection = getInjection;
            self.set = _set;
            self.get = _get;
            self.invoke = invoke;
            self.instantiate = instantiate;
        }
        app.injector = function() {
            return new Injector();
        };
    })();
    (function() {
        function Interpolator(injector) {
            var self = this;
            var ths = "this";
            var each = helpers.each;
            var errorHandler = function(er, extraMessage, data) {
                if (window.console && console.warn) {
                    console.warn(extraMessage + "\n" + er.message + "\n" + (er.stack || er.stacktrace || er.backtrace), data);
                }
            };
            function setErrorHandler(fn) {
                errorHandler = fn;
            }
            function interpolateError(er, scope, str, errorHandler) {
                errorHandler(er, app.errors.MESSAGES.E6a + str + app.errors.MESSAGES.E6b, scope);
            }
            function fixStrReferences(str, scope) {
                var c = 0, matches = [], i = 0, len;
                str = str.replace(/('|").*?\1/g, function(str, p1, offset, wholeString) {
                    var result = "*" + c;
                    matches.push(str);
                    c += 1;
                    return result;
                });
                str = str.replace(/(\.?[a-zA-Z\$\_]+\w?)/g, function(str, p1, offset, wholeString) {
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
                    each(parts, app.utils.trimStrings);
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
            function interpolate(scope, str) {
                var fn = Function, result, filter;
                str = formatters.stripLineBreaks(str);
                str = formatters.stripExtraSpaces(str);
                filter = parseFilter(str, scope);
                if (filter) {
                    str = filter.str;
                }
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
            self.exec = interpolate;
            self.setErrorHandler = setErrorHandler;
        }
        app.interpolator = function(injector) {
            return new Interpolator(injector);
        };
    })();
    (function() {
        var modules = {};
        function Module(name) {
            var self = this;
            self.name = name;
            var rootEl;
            var rootScope = app.scope();
            var bootstraps = [];
            var injector = app.injector();
            var interpolator = app.interpolator(injector);
            var compiler = app.compiler(self, injector, interpolator);
            var compile = compiler.compile;
            var interpolate = interpolator.exec;
            var injectorGet = injector.get;
            var injectorSet = injector.set;
            injector.set("$rootScope", rootScope);
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
                if (parentEl !== rootEl && rootEl.contains && !rootEl.contains(parentEl)) {
                    throw new Error("parent element not found in %o", rootEl);
                }
                parentEl.insertAdjacentHTML("beforeend", formatters.stripHTMLComments(htmlStr));
                var scope = findScope(parentEl), child = compile(parentEl.children[parentEl.children.length - 1], scope), s = child.scope && child.scope();
                return child;
            }
            function removeChild(childEl) {
                var scope = childEl.scope, i = 0, p, len;
                if (!scope) {
                    throw "no scope";
                }
                scope.$destroy();
                childEl.remove();
            }
            function element(el) {
                if (typeof el !== "undefined") {
                    rootEl = el;
                    compile(rootEl, rootScope);
                }
                return rootEl;
            }
            function service(name, ClassRef) {
                return injectorSet(name, new ClassRef(rootScope));
            }
            function ready() {
                var self = this;
                while (bootstraps.length) {
                    injector.invoke(bootstraps.shift(), self);
                }
                rootScope.$apply();
            }
            self.bootstrap = bootstrap;
            self.findScope = findScope;
            self.addChild = addChild;
            self.removeChild = removeChild;
            self.interpolate = interpolate;
            self.element = element;
            self.get = injectorGet;
            self.set = injectorSet;
            self.directive = injectorSet;
            self.filter = injectorSet;
            self.service = service;
            self.ready = ready;
        }
        app.module = function(name, forceNew) {
            return modules[name] = !forceNew && modules[name] || new Module(name);
        };
    })();
    (function() {
        var prototype = "prototype";
        var err = "error";
        var $c = console;
        function toArgsArray(args) {
            return Array[prototype].slice.call(args, 0) || [];
        }
        function every(list, predicate) {
            var returnVal = true;
            var i = 0, len = list.length;
            while (i < len) {
                if (!predicate(list[i])) {
                    returnVal = false;
                }
                i += 1;
            }
            return returnVal;
        }
        function initWatchVal() {}
        function Scope() {
            var self = this;
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
            var self = this;
            var watcher = {
                watchFn: watchFn,
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
            var dirty;
            var continueLoop = true;
            var self = this;
            self.$$scopes(function(scope) {
                var newValue, oldValue;
                var i = scope.$w.length;
                var watcher;
                while (i--) {
                    watcher = scope.$w[i];
                    try {
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
                    } catch (e) {
                        $c[err](e);
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
                        $c[err](e);
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
                    $c[err](e);
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
            return expr(this, locals);
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
            child.$w = [];
            child.$l = {};
            child.$c = [];
            child.$p = self;
            return child;
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
                    try {
                        listeners[i].apply(null, listenerArgs);
                    } catch (e) {
                        $c[err](e);
                    }
                    i++;
                }
            }
            return event;
        };
        app.scope = function() {
            return Scope;
        };
    })();
    app.utils = {};
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
    app.utils.trimStrings = function(str, index, list) {
        list[index] = str && str.trim();
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
    formatters.stripExtraSpaces = function(str) {
        str = str + "";
        return str.replace(/(\r\n|\n|\r)/gm, "");
    };
    formatters.stripHTMLComments = function(htmlStr) {
        htmlStr = htmlStr + "";
        return htmlStr.replace(/<!--[\s\S]*?-->/g, "");
    };
    formatters.stripLineBreaks = function(str) {
        str = str + "";
        return str.replace(/\s+/g, " ");
    };
    formatters.toTimeAgo = function(date) {
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