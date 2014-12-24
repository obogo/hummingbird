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
    var append = internal = function(name) {
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
                args.push(exports[injectionName] || exports[injectionName]);
            }
            if (fn.$internal) {
                $$internals[name] = fn.apply(null, args);
            } else {
                exports[name] = fn.apply(null, args);
            }
        }
        delete $$pending[name];
    };
    append("http.jsonp", [ "http" ], function(http) {
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
    append("query.width", [ "query", "query.css" ], function(query) {
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
    append("query.css", [ "query" ], function(query) {
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
    append("query.height", [ "query", "query.css" ], function(query) {
        query.fn.height = function(val) {
            return this.css("height", val);
        };
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
    append("query.bind", [ "query" ], function(query) {
        //! query.bind
        query.fn.bind = utils.query.fn.on = function(events, handler) {
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
    append("query.shortcuts", [ "query", "isDefined" ], function(query, isDefined) {
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
    append("query.trigger", [ "query" ], function(query) {
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
    append("query.unbind", [ "query" ], function(query) {
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
    append("query.unbindAll", [ "query" ], function(query) {
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
                    debugger;
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