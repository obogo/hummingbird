(function(exports, global) {
    global["hb"] = exports;
    var $$cache = {};
    var $$internals = {};
    var $$pending = {};
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
        delete $$pending[name];
    };
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
    internal("query.width", [ "query", "query.css" ], function(query) {
        query.fn.width = function(val) {
            return this.css("width", val);
        };
    });
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
    internal("query.height", [ "query", "query.css" ], function(query) {
        query.fn.height = function(val) {
            return this.css("height", val);
        };
    });
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
    define("removeLineBreaks", function() {
        var removeLineBreaks = function(str) {
            str = str + "";
            return str.replace(/(\r\n|\n|\r)/gm, "");
        };
        return removeLineBreaks;
    });
    define("removeExtraSpaces", function() {
        var removeExtraSpaces = function(str) {
            str = str + "";
            return str.replace(/\s+/g, " ");
        };
        return removeExtraSpaces;
    });
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
    define("removeHTMLComments", function() {
        var removeHTMLComments = function(htmlStr) {
            htmlStr = htmlStr + "";
            return htmlStr.replace(/<!--[\s\S]*?-->/g, "");
        };
        return removeHTMLComments;
    });
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
    internal("string.trim", [ "isString" ], function(isString) {
        if (!String.prototype.trim) {
            return function(value) {
                return isString(value) ? value.replace(/^\s\s*/, "").replace(/\s\s*$/, "") : value;
            };
        }
        return true;
    });
    define("isString", function() {
        var isString = function(val) {
            return typeof val === "string";
        };
        return isString;
    });
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
    internal("query.shortcuts", [ "query", "isDefined" ], function(query, isDefined) {
        //! query.change
        query.fn.change = function(handler) {
            var scope = this;
            if (isDefined(handler)) {
                scope.on("change", handler);
            } else {
                scope.trigger("change");
            }
            return scope;
        };
        //! query.click
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
    define("isDefined", function() {
        var isDefined = function(val) {
            return typeof val !== "undefined";
        };
        return isDefined;
    });
    internal("query.trigger", [ "query" ], function(query) {
        //! query.trigger
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
    internal("query.unbind", [ "query" ], function(query) {
        //! query.trigger
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
    internal("filters.lower", [ "framework" ], function(framework) {
        return framework.filters.upper = function(module) {
            module.filter("upper", function() {
                return function(val) {
                    return (val + "").toUpperCase();
                };
            });
        };
    });
    internal("plugins.http", [ "framework", "http" ], function(framework, http) {
        return framework.plugins.http = function(module) {
            return module.injector.val("http", http);
        };
    });
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
    for (var name in $$cache) {
        resolve(name, $$cache[name]);
    }
})({}, function() {
    return this;
}());