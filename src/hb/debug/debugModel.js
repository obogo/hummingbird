define('hb.debug.model', ['apply', 'consoleGraph'], function (apply, consoleGraph) {

    function create(model) {
        var logs = {};
        var enabled = {};
        var statsData = {};
        var liveStatsList = [];
        var liveStatsIntv = 0;
        var paletteIndex = 0;
        var palette = [
            '#3F51B5',// indigo
            '#4CAF50',// green
            '#FF9800',// orange
            '#f93b39',// red
            '#de9c1b',// yellow
            '#008bf5',// blue
            '#708bca',// purple
            '#87a5ae',// grey
            '#ff6092'// pink
        ];
        var colors = {};
        var debugEl;

        function nextColor() {
            var color = palette[paletteIndex];
            paletteIndex += 1;
            paletteIndex %= palette.length;
            return color;
        }

        function register(name, color) {
            logs[name] = logs[name] || new DebugModel(name);
            colors[name] = colors[name] || color || nextColor();// once set keep it.
            return logs[name];
        }

        function enable(name) {
            var success = false, a;
            for(var i = 0, len = arguments.length; i < len; i += 1) {
                a = arguments[i];
                if (logs[a]) {
                    enabled[a] = success = true;
                }
            }
            return success;
        }

        function log() {
            if (model.enabled && enabled[this.name]) {
                var args = Array.prototype.slice.call(arguments);
                var n = this.name;
                args = ["%c" + n + "::", "color:" + colors[n]].concat(args);
                if (window.console && console[this.mode]) {
                    apply(console[this.mode], console, args);
                }
            }
        }

        function logMethodFactory(mode) {
            return function () {
                this.mode = mode;
                apply(log, this, arguments);
            };
        }

        // stats
        function liveStats(name) {
            if (liveStatsList.indexOf(name) === -1) {
                liveStatsList.push(name);
                if (!liveStatsIntv) {
                    //TODO: finish this to have items show in the page. Live debugger.
                    debugEl = document.createElement('div');
                    debugEl.style.position = 'absolute';
                    debugEl.style.top = '0px';
                    debugEl.style.left = '0px';
                    debugEl.style.background = '#FFF';
                    document.body.appendChild(debugEl);
                    liveStatsIntv = setInterval(function () {
                        for (var i = 0, len = liveStatsList.length; i < len; i += 1) {
                            logItemStats(logs[liveStatsList[i]], true);
                        }
                    }, 1000);
                }
            }
        }

        function getStats() {
            return statsData[this.name] = statsData[this.name] || {};
        }

        function stat(name, newBlock, inc) {
            if (model.enabled) {
                var stats = this.getStats();
                var stat = stats[name] = stats[name] || [];
                var i = stat.length - 1;
                if (i === -1 || newBlock) {
                    i += 1;
                    stat[i] = 0;
                }
                stat[i] += inc || 1;
            }
        }

        function flushStats(name) {
            if (name) {
                this.getStats()[name] = [];
            }
            statsData[this.name] = {};
        }

        function logStats() {
            var i;
            for (i in statsData) {
                if (statsData.hasOwnProperty(i)) {
                    logItemStats(logs[i]);
                }
            }
            return " ";
        }

        function logItemStats(model, live) {
            var i, stats = model.getStats(), len, url, img;
            for (i in stats) {
                if (stats.hasOwnProperty(i)) {
                    len = stats[i].length;
                    if (len) {
                        if (live) {
                            //consoleGraph.point.x = 500;
                            url = consoleGraph.graph(stats[i], 0, i);
                            img = document.getElementById('debug.' + i);
                            if (!img) {
                                img = new Image();
                                img.id = 'debug.' + i;
                                img.style.display = 'block';
                                debugEl.appendChild(img);
                            }
                            img.src = url;
                        } else {
                            console.graph(stats[i], 0, i);
                        }
                    }
                }
            }
        }

        // debug model.

        function DebugModel(name) {
            this.name = name;
            this.mode = 'log';
        }

        DebugModel.prototype.log = logMethodFactory('log');
        DebugModel.prototype.info = logMethodFactory('info');
        DebugModel.prototype.warn = logMethodFactory('warn');
        DebugModel.prototype.error = logMethodFactory('error');
        DebugModel.prototype.stat = stat;
        DebugModel.prototype.getStats = getStats;
        DebugModel.prototype.flushStats = flushStats;

        model.enable = enable;
        model.enabled = true;
        model.register = register;
        model.liveStats = liveStats;
        model.getStats = function () {
            return statsData;
        };
        model.logStats = logStats;
        return model;
    }
    return create;
});