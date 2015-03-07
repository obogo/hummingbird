internal('benchmark', ['shades', 'rpad', 'functionName'], function (shades, rpad, functionName) {

    function LogItem(key, type, time, message) {
        var api = {}, _diff = -1;

        function toString() {
            if (api.type === 'start') {
                return '[' + api.key + '] (start:' + api.time + ') ' + api.message;
            }
            return '[' + api.key + '] (start:' + api.startTime + ' end:' + api.endTime + ' difference:' + api.diff() + ') ' + api.message;
        }

        function diff() {
            if (_diff < 0 && api.endTime > 0) {
                _diff = api.endTime - api.startTime;
            }
            return _diff;
        }

        api.startTime = -1;
        api.endTime = -1;
        api.key = key;
        api.type = type;
        api.time = time;
        api.message = message;
        api.diff = diff;
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
        addItem: function (item) {
            var diff = item.diff();
            this.items.push(item);
            this.max = diff > this.max ? diff : this.max;
            this.totalTime += diff;
            this.average = this.totalTime / this.count();
        },
        count: function () {
            return this.items.length;
        }
    };
//TODO: move to debugger.
    function renderer(data) {
        var item, i, j, len, jLen = data[0] && data[0].color.length;

        for (i = 0, len = data.length; i < len; i += 1) {
            item = data[i];
            console.log(item.name);
            for (j = 0; j < jLen; j += 1) {
                console.log("\t%c" + rpad("", " ", data[i].value[j] / 100), "font-size:10px;line-height:10px;width:10px;background:" + item.color[j] + ";", "\t" + item.label[j], "\t" + item.value[j]);
            }
        }
    }

    function Benchmark() {
        this.renderer = renderer;
        this.init();
    }

    Benchmark.prototype = {
        enable: true,
        START: 'start',
        STOP: 'stop',
        _logs: null,
        _stared: null,
        _reports: null,
        _reportsList: null,
        //_chart: null,
        _chartData: null,
        _chartDataLength: 0,
        _paused: false,
        threshold: null,
        hide: null,
        init: function () {
            this.filter = "";
            this.threshold = {
                count: 0,
                totalTime: 0,
                average: 0,
                max: 0,
                maxLength: 10,
                warnTime: 100 // ms
            };
            this.clear();
        },
        clear: function () {
            this._logs = [];
            this._started = {};
            this._reports = {};
            this._reportsList = [];
            this._chartData = this.createChartData();
            this.hide = {};
        },
        start: function (key, message) {
            if (!this.enable) {
                return;
            }
            var time = performance.now(),
                item;
            if (this._started[key]) {
                //                throw new Error("Attempt to start a key that is already started.");
                this.stop(key, message);
            }
            item = new LogItem(key, this.START, time, message);
            this._started[key] = item;
            this._logs.push(item);
        },
        stop: function (key) {
            if (!this.enable) {
                return;
            }
            var time = performance.now(),
                start = this._started[key];
            if (start) {
                start.startTime = start.time;
                start.endTime = time;
                delete this._started[key];
                this.addToReports(start);
            }
        },
        pause: function () {
            this._paused = true;
        },
        resume: function () {
            this._paused = false;
        },
        /**
         * This is only used for debugging.
         * @param detailed
         * @returns {string}
         */
        flush: function (detailed) {
            if (!this.enable) {
                return;
            }
            var i, ilen = this._logs.length,
                result = '', total = 0, count = 0, item, diff;
            if (detailed) {
                // write out items that are still running.
                for (i in this._stared) {
                    if (this._started.hasOwnProperty(i)) {
                        result += "STARTED:" + this._started[i].toString() + "\n";
                    }
                }
                result += "\n";
            }
            // write out items that are still running...
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
            return result + 'Average: ' + (count ? total / count : 0) + "ms\n" + (detailed ? result : '');
        },

        addToReports: function (item) {
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

        getKey: function (object) {
            return this.getClassName(object) || "unknown";
        },

        autoBenchMark: function (object, blacklist) {
            if (!this.enable) {
                return;
            }
            // we wrap every method in a wrapper function so we can test it's performance.
            var i, key = this.getKey(object);
            for (i in object) { // this should not have an if hasOwnProperty because we want to go through the prototype.
                if (i !== '_super' && i !== 'init' && typeof object[i] === "function" && !object[i].ignore && (!blacklist || blacklist.indexOf(i) === -1)) {
                    this.wrap(object, key, i);
                }
            }
        },

        wrap: function (object, benchKey, method) {
            if (method.indexOf('_bench') !== -1) {
                object[method].ignore = true;
                return;
            }
            var methodBenchName = method + '_bench',
                bench = this,
                methodName = benchKey + '.' + method;
            object[methodBenchName] = object[method];
            object[method] = function BenchMarkInterceptor() {
                var result;
                bench.start(methodName, "enter method");
                if (object[methodBenchName]) { // if an item is destroyed from a call to the same function we get stuck here.
                    result = object[methodBenchName].apply(object, arguments);
                }
                bench.stop(methodName, "exit method");
                return result;
            }.bind(object);
            if (window.angular) {
                if (object[methodBenchName].$inject) {
                    object[method].$inject = object[methodBenchName].$inject;
                } else {
                    var methodStr = object[methodBenchName].toString(),
                        args = methodStr.match(/\((.*?)?\)/)[1];
                    if (args) {
                        object[method].$inject = args ? args.replace(/\s+/g, '').split(',') : [];
                    }
                }
            }
            object[method].ignore = true;
        },

        getClassName: function (obj) {
            if (obj && obj.constructor && obj.constructor.toString) {
                var arr = obj.constructor.toString().match(/fuction\*(\w+)/);
                if (arr && arr.length === 2) {
                    return arr[1];
                } else {
                    return functionName(obj);
                }
            }
            return "";
        },

        getChartData: function () {
            return this._chartData;
        },

        //createChart: function (canvas) {
        //    this._chart = new BarChart(canvas[0]);
        //},

        invalidate: function (filter, threshold) {
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
                    this._renderReportBind = function () {
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

        _renderReport: function () {
            var i = 0, len, report, critical = 100, list, valueKey,
                colors = ["#336699", "#CCC", "#009900", "#009900"],
                labels = ["count", "total time", "avg time", "max time"];//["count %s", "total time %sms", "avg time %sms", "max time %sms"];
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
            // truncate all items that are too long.
            if (len < this._chartData.length) {
                this._chartData.length = len;
            }
            while (i < len) {
                report = list[i];
                valueKey = 0;
                this._chartData[i] = this._chartData[i] || {
                    name: report.key,
                    value: [report.count(), report.average, report.max],
                    color: [],
                    label: []
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
            //if (this._chart) {
            //    this._chart.update(this._chartData, {
            //        font: "7pt Calibri",
            //        labelMaxWidth: 200,
            //        barHeightMin: 30,
            //        padding: 4,
            //        titleHeight: 10,
            //        paddingRight: 120
            //    });
            //}
            this.renderer(this._chartData);
        },

        filterList: function (list, filter, threshold) {
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

        passThreshold: function (reportItem, threshold) {
            return reportItem.count() >= threshold.count &&
                reportItem.totalTime >= threshold.totalTime &&
                reportItem.average >= threshold.average &&
                reportItem.max >= threshold.max;
        },

        createChartData: function () {
            return [];
        },

        sortReportByCount: function (a, b) {
            return this.sortReport(a, b, 'count');
        },

        sortReportByTotalTime: function (a, b) {
            return this.sortReport(a, b, 'totalTime');
        },

        sortReportByAverage: function (a, b) {
            return this.sortReport(a, b, 'average');
        },

        sortReportByMax: function (a, b) {
            return this.sortReport(a, b, 'max');
        },

        sortReportByName: function (a, b) {
            return b.key > a.key ? -1 : (b.key < a.key ? 1 : 0);
        },

        sortReport: function (a, b, type) {
            return b[type] - a[type];
        }
    };

    return new Benchmark();
});