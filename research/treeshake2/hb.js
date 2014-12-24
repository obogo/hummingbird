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
    define("timer", [ "dispatcher", "StateMachine" ], function(dispatcher, StateMachine) {
        var Timer = function(options) {
            options = options || {};
            var scope = this, startTime = 0, totalTime = 0, elapsedTime = 0, timer;
            function init() {
                setupStateMachine();
                setupDispatcher();
            }
            function setupStateMachine() {
                StateMachine.create({
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
    define("StateMachine", function() {
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
        return StateMachine;
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