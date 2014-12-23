(function(exports, global) {
    global["hb"] = exports;
    var throwErrors = true, init = true, unresolved = [], internalCache = {}, required = [];
    function saveDefinition(key, dependencies, func, cache) {
        if (throwErrors && cache[key]) {
            throw new Error(key + " is already in use.");
        }
        if (typeof dependencies === "function") {
            cache[key] = dependencies.call(exports);
        } else {
            var fn = func;
            fn.$inject = dependencies;
            unresolved.push({
                key: key,
                fn: fn,
                cache: cache
            });
        }
    }
    function define(key, dependencies, func) {
        saveDefinition(key, dependencies, func, exports);
    }
    function internal(key, dependencies, func) {
        saveDefinition(key, dependencies, func, internalCache);
    }
    function require() {
        var args = Array.prototype.slice.call(arguments);
        var fn = args.pop();
        fn.$inject = args;
        unresolved.push({
            fn: fn,
            cache: exports
        });
        if (!init) {
            resolveAll();
        }
    }
    function acquire(name) {
        debugger;
        return exports[name] || internalCache[name];
    }
    function resolveDependencies(list) {
        var i, len = list.length, ary = list.slice(0);
        for (i = 0; i < len; i += 1) {
            ary[i] = acquire(ary[i]);
            if (!ary[i]) {
                return false;
            }
        }
        return ary;
    }
    function resolve(item) {
        var result;
        var args = resolveDependencies(item.fn.$inject);
        if (item && item.fn.$inject && args) {
            result = item.fn.apply(exports, args);
            if (item.key) {
                item.cache[item.key] = result;
            }
            return true;
        }
        return false;
    }
    function resolveAll() {
        var i = 0, len = unresolved.length;
        while (unresolved.length && i < unresolved.length) {
            console.log("resolve", unresolved[i]);
            if (resolve(unresolved[i])) {
                unresolved.splice(i, 1);
                i = 0;
            } else {
                i += 1;
            }
        }
    }
    internal("query.height", [ "query", "query.css" ], function(query) {
        debugger;
        query.fn.height = function() {
            return this.css("height");
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
    internal("query.width", [ "query", "query.css" ], function(query) {
        query.fn.width = function() {
            return this.css("width");
        };
    });
    throwErrors = false;
    init = false;
    resolveAll();
    while (required.length) {
        resolve(required.unshift());
    }
    exports.define = define;
    exports.require = require;
})({}, function() {
    return this;
}());