/*
* Hummingbird v.0.5.45
* Obogo - MIT 2015
* https://github.com/obogo/hummingbird/
*/
(function(exports, global) {
    global["hb"] = exports;
    var $$ = exports.$$ || function(name) {
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
    //! src/hb/debug/debugger.js
    //! pattern /hb\-debugger(\s|\=|>)/
    internal("hbd.debugger", [ "hb.directive", "benchmark", "lpad", "rpad" ], function(directive, benchmark, lpad, rpad) {
        var deb;
        function Debugger() {
            this.nameLength = 50;
        }
        directive("hbDebugger", function() {
            return {
                link: function(scope, $app) {
                    function getEl(scope) {
                        return document.querySelector("[" + $app.name + "-id='" + scope.$id + "']");
                    }
                    function mark(watcher, scope, newValue, oldValue) {
                        var key = scope.$id + (watcher.expr && '.$watch("' + watcher.expr + '", #)');
                        benchmark.start(key, {
                            scope: scope,
                            fn: watcher.listenerFn
                        });
                        watcher.listenerFn(newValue, oldValue, scope);
                        benchmark.stop(key);
                    }
                    function renderer(data) {
                        var item, i, len, name;
                        console.group("Benchmark");
                        for (i = 0, len = data.length; i < len; i += 1) {
                            item = data[i];
                            name = rpad(item.name.indexOf("#") && item.message && item.message.fn ? item.name.replace("#", benchmark.getClassName(item.message.fn)) : item.name, " ", deb.nameLength);
                            if (name.length > deb.nameLength) {
                                name = name.substr(0, deb.nameLength - 3) + "...";
                            }
                            console.groupCollapsed("%c", "border-left: 4px solid " + item.color[2] + ";border-right: 4px solid " + item.color[3] + ";", name, lpad(item.value[0] + "x", " ", 5), lpad("avg:" + (Math.floor(item.value[2] * 1e3) / 1e3).toFixed(3) + "ms", " ", 16));
                            var right = item.value[1] - item.value[3];
                            var diff = item.value[1] - right;
                            console.log("%c", "border-left:" + (Math.ceil(diff / 10) || 1) + "px solid " + item.color[3] + ";border-right:" + (Math.ceil(right / 10) || 1) + "px solid " + item.color[1] + ";", "largest:" + Math.floor(item.value[3] * 1e3) / 1e3 + "/total:" + Math.floor(item.value[1] * 1e3) / 1e3);
                            if (item.message && item.message.scope) {
                                item.message.el = getEl(item.message.scope);
                                console.log("%cdata %o", "font-weight:bold;", item.message);
                            }
                            console.log("%creport %o", "font-weight:bold;", item.report);
                            console.groupEnd();
                        }
                        console.groupEnd();
                    }
                    function benchMarkRender(maxLen, minTotalMS) {
                        benchmark.threshold.maxLength = maxLen || 10;
                        benchmark.threshold.totalTime = minTotalMS || 1;
                        benchmark.invalidate();
                        return "";
                    }
                    benchmark.watch = mark;
                    deb.getEl = getEl;
                    deb.benchmark = benchmark;
                    scope.$benchmark = benchmark;
                    benchmark.renderer = renderer;
                    deb.render = benchMarkRender;
                    benchmark.autoBenchMark($app);
                }
            };
        });
        deb = new Debugger();
        exports.debugger = deb;
        return deb;
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
    //! src/utils/reports/benchmark.js
    internal("benchmark", [ "shades", "rpad", "functionName" ], function(shades, rpad, functionName) {
        function LogItem(key, type, time, message) {
            var api = {};
            function toString() {
                if (api.type === "start") {
                    return "[" + api.key + "] (start:" + api.time + ") " + api.message;
                }
                return "[" + api.key + "] (start:" + api.startTime + " end:" + api.endTime + " difference:" + api.diff() + ") " + api.message;
            }
            function diff() {
                if (api._diff < 0 && api.endTime > 0) {
                    api._diff = api.endTime - api.startTime;
                }
                return api._diff;
            }
            api.startTime = -1;
            api.endTime = -1;
            api.key = key;
            api.type = type;
            api.time = time;
            api.message = message;
            api.diff = diff;
            api._diff = -1;
            api.toString = toString;
            return api;
        }
        function ReportItem(item) {
            this.key = item.key;
            this.message = item.message;
            this.items = [];
        }
        ReportItem.prototype = {
            key: null,
            message: null,
            items: null,
            totalTime: 0,
            max: 0,
            average: 0,
            addItem: function(item) {
                var diff = item.diff();
                this.items.push(item);
                this.max = diff > this.max ? diff : this.max;
                this.totalTime += diff;
                this.average = this.totalTime / this.count();
            },
            count: function() {
                return this.items.length;
            }
        };
        function renderer(data) {
            var item, i, j, len, jLen = data[0] && data[0].color.length;
            for (i = 0, len = data.length; i < len; i += 1) {
                item = data[i];
                console.log(item.name);
                for (j = 0; j < jLen; j += 1) {
                    console.log("	%c" + rpad("", " ", data[i].value[j] / 100), "font-size:10px;line-height:10px;width:10px;background:" + item.color[j] + ";", "	" + item.label[j], "	" + item.value[j]);
                }
            }
        }
        function Benchmark() {
            this.renderer = renderer;
            this.init();
        }
        Benchmark.prototype = {
            enable: true,
            START: "start",
            STOP: "stop",
            _logs: null,
            _stared: null,
            _reports: null,
            _reportsList: null,
            _chartData: null,
            _chartDataLength: 0,
            _paused: false,
            threshold: null,
            hide: null,
            init: function() {
                this.filter = "";
                this.threshold = {
                    count: 0,
                    totalTime: 0,
                    average: 0,
                    max: 0,
                    maxLength: 10,
                    warnTime: 100
                };
                this.clear();
            },
            clear: function() {
                this._logs = [];
                this._started = {};
                this._reports = {};
                this._reportsList = [];
                this._chartData = this.createChartData();
                this.hide = {};
            },
            start: function(key, message) {
                if (!this.enable) {
                    return;
                }
                var time = performance.now(), item;
                if (this._started[key]) {
                    this.stop(key, message);
                }
                item = new LogItem(key, this.START, time, message);
                this._started[key] = item;
                this._logs.push(item);
            },
            stop: function(key) {
                if (!this.enable) {
                    return;
                }
                var time = performance.now(), start = this._started[key];
                if (start) {
                    start.startTime = start.time;
                    start.endTime = time;
                    delete this._started[key];
                    this.addToReports(start);
                }
            },
            pause: function() {
                this._paused = true;
            },
            resume: function() {
                this._paused = false;
            },
            flush: function(detailed) {
                if (!this.enable) {
                    return;
                }
                var i, ilen = this._logs.length, result = "", total = 0, count = 0, item, diff;
                if (detailed) {
                    for (i in this._stared) {
                        if (this._started.hasOwnProperty(i)) {
                            result += "STARTED:" + this._started[i].toString() + "\n";
                        }
                    }
                    result += "\n";
                }
                for (i = 0; i < ilen; i += 1) {
                    item = this._logs[i];
                    diff = item.diff();
                    if (diff) {
                        total += diff;
                        count += 1;
                    }
                    if (detailed) {
                        result += item.toString() + "\n";
                    }
                }
                this._started = {};
                this._logs.length = 0;
                return result + "Average: " + (count ? total / count : 0) + "ms\n" + (detailed ? result : "");
            },
            addToReports: function(item) {
                var report = this._reports[item.key] || new ReportItem(item);
                if (!this._reports[item.key]) {
                    this._reports[item.key] = report;
                    this._reportsList.push(report);
                }
                this._reports[item.key].addItem(item);
                if (item.endTime - item.startTime > this.threshold.warnTime) {
                    console.warn("Benchmark:: Warning " + this.threshold.warnTime + "ms exceeded.");
                    this.invalidate(this.filter, this.threshold);
                }
            },
            getKey: function(object) {
                return this.getClassName(object) || "unknown";
            },
            autoBenchMark: function(object, blacklist) {
                if (!this.enable) {
                    return;
                }
                var i, key = this.getKey(object);
                for (i in object) {
                    if (i !== "_super" && i !== "init" && typeof object[i] === "function" && !object[i].ignore && (!blacklist || blacklist.indexOf(i) === -1)) {
                        this.wrap(object, key, i);
                    }
                }
            },
            wrap: function(object, benchKey, method) {
                if (method.indexOf("_bench") !== -1) {
                    object[method].ignore = true;
                    return;
                }
                var methodBenchName = method + "_bench", bench = this, methodName = benchKey + "." + method;
                object[methodBenchName] = object[method];
                object[method] = function BenchMarkInterceptor() {
                    var result;
                    bench.start(methodName, arguments);
                    if (object[methodBenchName]) {
                        result = object[methodBenchName].apply(object, arguments);
                    }
                    bench.stop(methodName);
                    return result;
                }.bind(object);
                if (window.angular) {
                    if (object[methodBenchName].$inject) {
                        object[method].$inject = object[methodBenchName].$inject;
                    } else {
                        var methodStr = object[methodBenchName].toString(), args = methodStr.match(/\((.*?)?\)/)[1];
                        if (args) {
                            object[method].$inject = args ? args.replace(/\s+/g, "").split(",") : [];
                        }
                    }
                }
                object[method].ignore = true;
            },
            getClassName: function(obj) {
                if (obj && obj.constructor && obj.constructor.toString) {
                    var arr = obj.constructor.toString().match(/function\s+(\w+)/);
                    if (arr && arr.length === 2) {
                        return arr[1];
                    } else {
                        return functionName(obj);
                    }
                }
                return "";
            },
            getChartData: function() {
                return this._chartData;
            },
            invalidate: function(filter, threshold) {
                if (!this.enable) {
                    return;
                }
                if (this._paused) {
                    return;
                }
                if (!this._renderPending) {
                    this.filter = filter || "";
                    this.threshold = threshold || this.threshold;
                    this._pendingRender = false;
                    this._pendingFilter = "";
                    this._pendingThreshold = 0;
                    if (!this._renderReportBind) {
                        this._renderReportBind = function() {
                            this._renderReport();
                            clearTimeout(this._renderPending);
                            this._renderPending = 0;
                            if (this._pendingRender) {
                                this.invalidate(this._pendingFilter, this._pendingThreshold);
                            }
                        }.bind(this);
                    }
                    this._renderPending = setTimeout(this._renderReportBind, 100);
                } else {
                    this._pendingRender = true;
                    this._pendingFilter = filter;
                    this._pendingThreshold = filter;
                }
            },
            _renderReport: function() {
                var i = 0, len, report, critical = 100, list, valueKey, colors = [ "#336699", "#CCC", "#009900", "#009900" ], labels = [ "count", "total time", "avg time", "max time" ];
                if (!this.sort) {
                    this.sortReportByCountBind = this.sortReportByCount.bind(this);
                    this.sortReportByTotalTimeBind = this.sortReportByTotalTime.bind(this);
                    this.sortReportByAverageBind = this.sortReportByAverage.bind(this);
                    this.sortReportByMaxBind = this.sortReportByMax.bind(this);
                    this.sortReportByNameBind = this.sortReportByName.bind(this);
                    this.sort = this.sortReportByMaxBind;
                }
                list = this._reportsList;
                if (this.filter || this.threshold) {
                    list = this.filterList(list, this.filter, this.threshold);
                }
                list = list.sort(this.sort);
                len = list.length;
                len = len > this.threshold.maxLength ? this.threshold.maxLength : len;
                if (len < this._chartData.length) {
                    this._chartData.length = len;
                }
                while (i < len) {
                    report = list[i];
                    valueKey = 0;
                    this._chartData[i] = this._chartData[i] || {
                        name: report.key,
                        value: [ report.count(), report.average, report.max ],
                        color: [],
                        label: [],
                        report: report
                    };
                    this._chartData[i].name = report.key;
                    this._chartData[i].message = report.message;
                    if (!this.hide.count) {
                        this._chartData[i].value[valueKey] = report.count();
                        this._chartData[i].color[valueKey] = colors[0];
                        this._chartData[i].label[valueKey] = labels[0];
                        valueKey += 1;
                    }
                    if (!this.hide.totalTime) {
                        this._chartData[i].value[valueKey] = report.totalTime;
                        this._chartData[i].color[valueKey] = colors[1];
                        this._chartData[i].label[valueKey] = labels[1];
                        valueKey += 1;
                    }
                    if (!this.hide.average) {
                        this._chartData[i].value[valueKey] = report.average;
                        this._chartData[i].color[valueKey] = shades.getRGBStr(report.average / critical);
                        this._chartData[i].label[valueKey] = labels[2];
                        valueKey += 1;
                    }
                    if (!this.hide.max) {
                        this._chartData[i].value[valueKey] = report.max;
                        this._chartData[i].color[valueKey] = shades.getRGBStr(report.max / critical);
                        this._chartData[i].label[valueKey] = labels[3];
                    }
                    while (this._chartData[i].value.length - 1 > valueKey) {
                        this._chartData[i].value.pop();
                        this._chartData[i].color.pop();
                        this._chartData[i].label.pop();
                    }
                    i += 1;
                }
                this._chartDataLength = i;
                this.renderer(this._chartData);
            },
            filterList: function(list, filter, threshold) {
                var i = 0, len = list.length, result = [], reportItem;
                filter = (filter || "").toLowerCase();
                while (i < len) {
                    reportItem = list[i];
                    if (this.passThreshold(reportItem, threshold) && reportItem.key.toLowerCase().indexOf(filter) !== -1) {
                        result.push(reportItem);
                    }
                    i += 1;
                }
                return result;
            },
            passThreshold: function(reportItem, threshold) {
                return reportItem.count() >= threshold.count && reportItem.totalTime >= threshold.totalTime && reportItem.average >= threshold.average && reportItem.max >= threshold.max;
            },
            createChartData: function() {
                return [];
            },
            sortReportByCount: function(a, b) {
                return this.sortReport(a, b, "count");
            },
            sortReportByTotalTime: function(a, b) {
                return this.sortReport(a, b, "totalTime");
            },
            sortReportByAverage: function(a, b) {
                return this.sortReport(a, b, "average");
            },
            sortReportByMax: function(a, b) {
                return this.sortReport(a, b, "max");
            },
            sortReportByName: function(a, b) {
                return b.key > a.key ? -1 : b.key < a.key ? 1 : 0;
            },
            sortReport: function(a, b, type) {
                return b[type] - a[type];
            }
        };
        return new Benchmark();
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
        }();
        return shades;
    });
    //! src/utils/formatters/rpad.js
    define("rpad", function() {
        var rpad = function(str, char, len) {
            while (str.length < len) {
                str += char;
            }
            return str;
        };
        return rpad;
    });
    //! src/utils/parsers/functionName.js
    define("functionName", function() {
        return function(fn) {
            var f = typeof fn === "function";
            var s = f && (fn.name && [ "", fn.name ] || fn.toString().match(/function ([^\(]+)/));
            return !f && "not a function" || (s && s[1] || "anonymous");
        };
    });
    //! src/utils/formatters/lpad.js
    define("lpad", function() {
        var lpad = function(str, char, len) {
            while (str.length < len) {
                str = char + str;
            }
            return str;
        };
        return lpad;
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
                    scope.$watch(function classAttr() {
                        this.expr = "class";
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
    //! src/hb/directives/autoscroll.js
    internal("hbd.autoscroll", [ "hb.directive", "query" ], function(directive, query) {
        directive("hbAutoscroll", function($app) {
            var $ = query;
            var win = window;
            function outerHeight(el) {
                var height = el.offsetHeight;
                var style = getComputedStyle(el);
                height += parseInt(style.marginTop, 10) + parseInt(style.marginBottom, 10);
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
                scrollTo = parseInt(scrollTo, 10);
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
    //! src/utils/query/focus/focus.js
    //! pattern /("|')query\1/
    internal("query.focus", [ "query" ], function(query) {
        query.fn.focus = function(val) {
            this.each(function(index, el) {
                el.focus();
            });
            return this;
        };
    });
    //! src/utils/query/focus/select.js
    //! pattern /("|')query\1/
    //! import query.val
    internal("query.cursor", [ "query" ], function(query) {
        query.fn.getCursorPosition = function() {
            if (this.length === 0) {
                return -1;
            }
            return query(this).getSelectionStart();
        };
        query.fn.setCursorPosition = function(position) {
            if (this.length === 0) {
                return this;
            }
            return query(this).setSelection(position, position);
        };
        query.fn.getSelection = function() {
            if (this.length === 0) {
                return -1;
            }
            var s = query(this).getSelectionStart();
            var e = query(this).getSelectionEnd();
            return this[0].value.substring(s, e);
        };
        query.fn.getSelectionStart = function() {
            if (this.length === 0) {
                return -1;
            }
            var input = this[0];
            var pos = input.value.length;
            if (input.createTextRange) {
                var r = document.selection.createRange().duplicate();
                r.moveEnd("character", input.value.length);
                if (r.text === "") {
                    pos = input.value.length;
                }
                pos = input.value.lastIndexOf(r.text);
            } else if (typeof input.selectionStart !== "undefined") {
                pos = input.selectionStart;
            }
            return pos;
        };
        query.fn.getSelectionEnd = function() {
            if (this.length === 0) {
                return -1;
            }
            var input = this[0];
            var pos = input.value.length;
            if (input.createTextRange) {
                var r = document.selection.createRange().duplicate();
                r.moveStart("character", -input.value.length);
                if (r.text === "") {
                    pos = input.value.length;
                }
                pos = input.value.lastIndexOf(r.text);
            } else if (typeof input.selectionEnd !== "undefined") {}
            return pos;
        };
        query.fn.setSelection = function(selectionStart, selectionEnd) {
            if (this.length === 0) {
                return this;
            }
            var input = this[0];
            if (input.createTextRange) {
                var range = input.createTextRange();
                range.collapse(true);
                range.moveEnd("character", selectionEnd);
                range.moveStart("character", selectionStart);
                range.select();
            } else if (input.setSelectionRange) {
                input.setSelectionRange(selectionStart, selectionEnd);
            }
            return this;
        };
        query.fn.setSelectionRange = function(range) {
            var element = query(this);
            switch (range) {
              case "start":
                element.setSelection(0, 0);
                break;

              case "end":
                element.setSelection(element.val().length, element.val().length);
                break;

              case true:
              case "all":
                element.setSelection(0, element.val().length);
                break;
            }
        };
        query.fn.select = function() {
            this.setSelectionRange(true);
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
        var debounce = function(func, wait, scope) {
            var timeout;
            return function() {
                var context = scope || this, args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    timeout = null;
                    func.apply(context, args);
                }, wait);
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
    internal("hbd.class", [ "hb.directive" ], function(directive) {
        directive("hbClass", function($app) {
            return {
                link: function(scope, el, alias) {
                    scope.$watch(function hbClass() {
                        this.expr = alias.value;
                        var classes = $app.interpolate(scope, alias.value), contained;
                        for (var e in classes) {
                            if (classes.hasOwnProperty(e)) {
                                contained = el.classList.contains(e);
                                if (classes[e]) {
                                    el.classList.add(e);
                                } else if (contained) {
                                    el.classList.remove(e);
                                }
                            }
                        }
                    });
                }
            };
        });
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
    internal("hbd.directiveRepeat", [ "hb.directive", "fromCamelToDash" ], function(directive, fromCamelToDash) {
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
                    function removeUntil(len, list) {
                        var child;
                        var keepers = [];
                        var i, childrenLen, index;
                        if (list && list.length) {
                            for (i = 0, childrenLen = el.children.length; i < childrenLen; i += 1) {
                                child = el.children[i];
                                index = list.indexOf(child.scope[scopeProperty]);
                                if (index !== -1) {
                                    keepers.push(child);
                                }
                            }
                        }
                        i = 0;
                        while (child && el.children.length > len) {
                            child = el.children[i];
                            if (child.scope && child.scope !== scope && keepers.indexOf(child) === -1) {
                                child.scope.$destroy();
                                el.removeChild(child);
                                i -= 1;
                            } else if (!child.scope) {
                                el.removeChild(child);
                                i -= 1;
                            }
                            i += 1;
                        }
                    }
                    function render(list, oldList) {
                        var i = 0, len, child, s, dir, type, typeDash, itemTpl;
                        if (list && typeof list === "string" && list.length) {
                            list = [ list ];
                        }
                        if (list && list.length) {
                            len = list.length || 0;
                            removeUntil(len, list);
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
                                    typeDash = fromCamelToDash(type);
                                    itemTpl = tpl ? tpl.replace(/<(\/?\w+)/g, "<" + typeDash) : "<" + typeDash + "></" + typeDash + ">";
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
                            removeUntil(0);
                        }
                        scope.$emit("hbDirectiveRepeat::render");
                    }
                    scope.$watch(alias.value, render, true);
                    render(scope.$eval(alias.value));
                } ]
            };
        } ]);
    });
    //! src/utils/formatters/fromCamelToDash.js
    define("fromCamelToDash", function() {
        return function(str) {
            return str.replace(/([A-Z])/g, function(g) {
                return "-" + g.toLowerCase();
            });
        };
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
        var UI_EVENTS = "click mousedown mouseup mouseover mouseout keydown keyup touchstart touchend touchmove".split(" ");
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
    internal("hbd.model", [ "hb.directive", "resolve", "query", "hb.errors", "throttle" ], function(directive, resolve, query, errors, throttle) {
        directive("hbModel", function() {
            var $ = query;
            return {
                link: function(scope, el, alias) {
                    var $el = $(el);
                    scope.$watch(alias.value, setValue);
                    function setValue(value) {
                        value = value === undefined ? "" : value;
                        if (el.hasOwnProperty("value")) {
                            el.value = value;
                        } else if (el.hasOwnProperty("innerText")) {
                            el.innerText = value;
                        } else {
                            throw errors.E13;
                        }
                    }
                    function eventHandler(evt) {
                        resolve(scope).set(alias.value, el.hasOwnProperty("value") ? el.value : el.innerText);
                        var change = el.getAttribute("hb-change");
                        if (change) {
                            scope.$eval(change);
                        }
                        scope.$apply();
                    }
                    $el.bind("change keyup blur input onpropertychange", throttle(eventHandler, 10));
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
    //! src/hb/utils/directive.js
    internal("hb.directive", [ "hb.val" ], function(val) {
        return val;
    });
    //! src/utils/data/resolve.js
    define("resolve", [ "isUndefined" ], function(isUndefined) {
        function Resolve(data) {
            this.data = data || {};
        }
        var proto = Resolve.prototype;
        proto.get = function(path, delimiter) {
            path = path || "";
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
            if (isUndefined(path)) {
                throw new Error('Resolve requires "path"');
            }
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
            if (arr.length > 0) {
                data[arr.pop()] = value;
            }
            return this.data;
        };
        proto.clear = function() {
            var d = this.data;
            for (var e in d) {
                if (d.hasOwnProperty(e)) {
                    delete d[e];
                }
            }
        };
        proto.path = function(path) {
            return this.set(path, {});
        };
        var resolve = function(data) {
            return new Resolve(data);
        };
        return resolve;
    });
    //! src/utils/validators/isUndefined.js
    define("isUndefined", function() {
        var isUndefined = function(val) {
            return typeof val === "undefined";
        };
        return isUndefined;
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
                    function removeUntil(len) {
                        var child;
                        while (el.children.length > len) {
                            child = el.children[0];
                            if (child.scope && child.scope !== scope) {
                                child.scope.$destroy();
                            }
                            el.removeChild(child);
                        }
                    }
                    function render(list, oldList) {
                        if (list && list.length) {
                            removeUntil(list.length);
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
                            removeUntil(0);
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
    //! src/hb/directives/style.js
    internal("hbd.style", [ "hb.directive", "fromDashToCamel" ], function(directive, fromDashToCamel) {
        directive("hbStyle", function($app) {
            return {
                link: function(scope, el, alias) {
                    scope.$watch(function style() {
                        this.expr = alias.value;
                        var styles = $app.interpolate(scope, alias.value);
                        var name;
                        for (var e in styles) {
                            if (styles.hasOwnProperty(e)) {
                                name = fromDashToCamel(e);
                                if (el.style[name] !== styles[e]) {
                                    el.style[name] = styles[e];
                                }
                            }
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
    //! src/hb/filters/lower.js
    //! pattern /(\|lower|\(\'lower\'\))/
    internal("hbf.lower", [ "hb.filter" ], function(filter) {
        filter("lower", function() {
            return function(val) {
                return (val + "").toLowerCase();
            };
        });
    });
    //! src/hb/utils/filter.js
    internal("hb.filter", [ "hb.val" ], function(val) {
        return val;
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
                        if (data.hasOwnProperty(i)) {
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
    //! src/hb/utils/compiler.js
    internal("hb.compiler", [ "each", "fromDashToCamel" ], function(each, fromDashToCamel) {
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
                    attr: getAttributes(el),
                    alias: directive.alias
                });
            }
            function getAttributes(el) {
                var attr = {}, i;
                for (i = 0; i < el.attributes.length; i += 1) {
                    var at = el.attributes[i];
                    var key = fromDashToCamel((at.name || at.localName || at.nodeName).replace(/^data\-/, ""));
                    attr[key] = at.value;
                }
                return attr;
            }
            function link(el, scope) {
                if (el) {
                    el.setAttribute(ID, scope.$id);
                    $app.elements[scope.$id] = el;
                    el.scope = scope;
                }
            }
            function findDirectives(el, scope) {
                var attributes = el.attributes, attrs = [ {
                    name: el.nodeName.toLowerCase(),
                    value: ""
                } ], attr, returnVal = [], i, len = attributes.length, name, directiveFn, leftovers = [];
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
                    } else if (attr.value && attr.value.indexOf($app.bindingMarkup[0]) !== -1) {
                        leftovers.push(attr);
                    }
                }
                len = leftovers.length;
                for (i = 0; i < len; i += 1) {
                    attr = leftovers[i];
                    el.setAttribute(attr.name, parseBinds(attr.value, el.scope || scope));
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
                    var directives = findDirectives(el, scope), links = [];
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
                    return false;
                }
                var newValue, oldValue;
                var i = scope.$w.length;
                var watcher;
                while (i--) {
                    watcher = scope.$w[i];
                    if (watcher) {
                        newValue = watcher.watchFn(scope);
                        oldValue = watcher.last;
                        if (!scope.$$areEqual(newValue, oldValue, watcher.deep) || oldValue === initWatchVal) {
                            scope.$r.$lw = watcher;
                            watcher.last = watcher.deep ? JSON.stringify(newValue) : newValue;
                            if (scope.$benchmark) {
                                scope.$benchmark.watch(watcher, scope, newValue, oldValue === initWatchVal ? newValue : oldValue);
                            } else {
                                watcher.listenerFn(newValue, oldValue === initWatchVal ? newValue : oldValue, scope);
                            }
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
        scopePrototype.$ignoreEvents = function(enabled, childrenOnly) {
            var self = this;
            if (enabled !== undefined) {
                every(self.$c, function(scope) {
                    scope.$$ignoreEvents = enabled;
                });
                if (!childrenOnly) {
                    self.$$ignoreEvents = enabled;
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
            if (self.$$ignoreEvents && self.eventName !== "$destroy") {
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
            if (self.$$ignoreEvents && self.eventName !== "$destroy") {
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
    //! src/utils/patterns/injector.js
    define("injector", [ "isFunction", "toArray", "functionArgs" ], function(isFunction, toArray, functionArgs) {
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
                fn.$inject = functionArgs(fn);
            }
            var args = fn.$inject ? fn.$inject.slice() : [], i, len = args.length;
            for (i = 0; i < len; i += 1) {
                this.getInjection(args[i], i, args, locals, scope);
            }
            return args;
        };
        proto.getArgs = functionArgs;
        proto.getInjection = function(type, index, list, locals, scope) {
            var result, cacheValue;
            if (locals && locals[type]) {
                result = locals[type];
            } else if ((cacheValue = this.val(type)) !== undefined) {
                result = cacheValue;
            }
            if (result === undefined) {
                console.warn("Injection not found for " + type);
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
    define("isArguments", [ "toString" ], function(toString) {
        var isArguments = function(value) {
            var str = String(value);
            var isArguments = str === "[object Arguments]";
            if (!isArguments) {
                isArguments = str !== "[object Array]" && value !== null && typeof value === "object" && typeof value.length === "number" && value.length >= 0 && (!value.callee || toString.call(value.callee) === "[object Function]");
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
    //! src/utils/parsers/functionArgs.js
    define("functionArgs", function() {
        return function(fn) {
            var str = (fn || "") + "";
            return str.match(/\(.*\)/)[0].match(/([\$\w])+/gm);
        };
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
                var bool = str.toLowerCase();
                if (bool !== "true" && bool !== "false") {
                    return ths + "." + str;
                }
                return str;
            }
            function parseFilter(str, scope) {
                if (str.indexOf("|") !== -1 && str.match(/("|')?\w+\s?\1?\|\s?\w+/)) {
                    str = str.replace("||", "~~");
                    var parts = str.trim().split("|");
                    parts[1] = parts[1].replace("~~", "||");
                    each.call({
                        all: true
                    }, parts, trimStrings);
                    parts[1] = parts[1].split(":");
                    var filterName = parts[1].shift().split("-").join(""), filter = injector.val(filterName), args;
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
        hb.plugins.mocks = function(module) {
            module.mocks = module.mocks || module.injector.instantiate(Mocks);
            return module.mocks;
        };
        return hb.plugins.mocks;
    });
    //! src/hb/plugins/router.js
    internal("hb.plugins.router", [ "hb", "each", "parseRoute" ], function(hb, each, parseRoute) {
        function Router($app, $rootScope, $window) {
            var self = this, events = {
                CHANGE: "router::change"
            }, $location = $window.document.location, $history = $window.history, prev, current, states = {}, base = $location.pathname, lastHashUrl;
            function add(state) {
                if (typeof state === "string") {
                    return addState(arguments[1], state);
                }
                each.call({
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
                    each.call({
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
                var params = parseRoute.extractParams(state.url, url);
                go(state.id, params, skipPush);
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
                var state = each(states, doesStateMatchPath, url.split("?").shift());
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
        hb.plugins.router = function(module) {
            var result = module.router = module.router || module.injector.instantiate(Router);
            return module.injector.val("router", result);
        };
        return hb.plugins.router;
    });
    //! src/utils/parsers/parseRoute.js
    define("parseRoute", [ "each" ], function(each) {
        function keyValues(key, index, list, result, parts) {
            if (key[0] === ":") {
                result[key.replace(":", "")] = parts[index];
            }
        }
        function urlKeyValues(str, result) {
            var parts = str.split("=");
            result[parts[0]] = parts[1];
        }
        function getPathname(url, dropQueryParams) {
            if (dropQueryParams) {
                url = url.split("?").shift();
            }
            url = url.replace(/^\w+:\/\//, "");
            url = url.replace(/^\w+:\d+\//, "/");
            url = url.replace(/^\w+\.\w+\//, "/");
            return url;
        }
        function extractParams(patternUrl, url, combined) {
            url = getPathname(url);
            var parts = url.split("?"), searchParams = parts[1], params = {}, queryParams = {};
            if (patternUrl[0] === "/" && parts[0][0] !== "/") {
                parts[0] = "/" + parts[0];
            }
            parts = parts[0].split("/");
            each.call({
                all: true
            }, patternUrl.split("/"), keyValues, params, parts);
            if (searchParams) {
                each(searchParams.split("&"), urlKeyValues, queryParams);
            }
            return combined ? combine({}, [ params, queryParams ]) : {
                params: params,
                query: queryParams
            };
        }
        function combine(target, objects) {
            var i, j, len = objects.length, object;
            for (i = 0; i < len; i += 1) {
                object = objects[i];
                for (j in object) {
                    if (object.hasOwnProperty(j)) {
                        target[j] = object[j];
                    }
                }
            }
            return target;
        }
        function match(patternUrl, url) {
            var patternParams = patternUrl.indexOf("?") !== -1 ? patternUrl.split("?").pop().split("&") : [];
            patternUrl.replace(/:(\w+)/g, function(match, g) {
                patternParams.push(g);
                return match;
            });
            var values = extractParams(patternUrl.split("?").shift(), url, true);
            var hasParams = !!patternParams.length;
            if (hasParams) {
                each(patternParams, function(value) {
                    if (value === "") {} else if (!values.hasOwnProperty(value) || values[value] === undefined) {
                        hasParams = false;
                    }
                });
                if (!hasParams) {
                    return null;
                }
            }
            var matchUrl = patternUrl.split("?").shift().replace(/\/:(\w+)/g, function(match, g1) {
                return "/" + values[g1];
            });
            var endOfPathName = getPathname(url, true);
            return endOfPathName === matchUrl;
        }
        return {
            extractParams: extractParams,
            match: match
        };
    });
    //! src/hb/utils/service.js
    internal("hb.service", [ "hb.val" ], function(val) {
        return val;
    });
    for (var name in cache) {
        resolve(name, cache[name]);
    }
})(this["hb"] || {}, function() {
    return this;
}());