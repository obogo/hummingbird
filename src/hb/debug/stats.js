define('hb.debug.stats', ['hb.debug.item', 'hb.debug.stats.item', 'consoleGraph', 'hb.debug.colors'], function (debugItem, statsItem, consoleGraph, colors) {

    function statsBehavior(model) {
        var statsData = {};
        var liveStatsList = [];
        var liveStatsIntv = 0;
        var imgs = {};
        var debugEl;

        // stats
        function liveStats(name) {
            for(var i = 0, len = arguments.length; i < len; i += 1) {
                name = arguments[i];
                if (liveStatsList.indexOf(name) === -1) {
                    liveStatsList.push(name);
                    if (!liveStatsIntv) {
                        // if they provide this element. Use it. Otherwise make our own.
                        debugEl = document.getElementById('hb-debug-stats');
                        if (!debugEl) {
                            debugEl = document.createElement('div');
                            debugEl.id = 'debug-stats';
                            debugEl.style.position = 'absolute';
                            debugEl.style.top = '0px';
                            debugEl.style.left = '0px';
                            debugEl.style.background = '#FFF';
                            document.body.appendChild(debugEl);
                        }
                        liveStatsIntv = setInterval(function () {
                            for (var i = 0, len = liveStatsList.length; i < len; i += 1) {
                                logItemStats(statsData[liveStatsList[i]], true, liveStatsList[i]);
                            }
                        }, 1000);
                    }
                }
            }
        }

        function getStats() {
            return statsData[this.name] = statsData[this.name] || {};
        }

        function stat(name, color) {
            var stats = this.getStats();
            return stats[name] = stats[name] || new statsItem(name, color || this.color);
        }

        function flushStats(name) {
            if (name) {
                this.getStats()[name].clear();
            }
            statsData[this.name] = {};
        }

        function logStats() {
            var i;
            for (i in statsData) {
                if (statsData.hasOwnProperty(i) && statsData[i].data.length && statsData[i].enabled) {
                    logItemStats.call(this, statsData[i]);
                }
            }
            return " ";
        }

        function getImg(name) {
            var img;
            if (!imgs[name]) {
                img = new Image();
                img.style.display = 'block';
                debugEl.appendChild(img);
                imgs[name] = img;
            }
            return imgs[name];
        }

        function logItemStats(stats, live, label) {
            var i, len, url, img;
            for (i in stats) {
                if (stats.hasOwnProperty(i)) {
                    len = stats[i].data.length;
                    if (len) {
                        if (live) {
                            //consoleGraph.point.x = 500;
                            if (stats[i].dirty) {
                                stats[i].dirty = false;
                                url = consoleGraph.graph(stats[i].data, label + ':: ' + i, stats[i].color);
                                img = getImg.call(this, i);
                                img.src = url;
                            }
                        } else {
                            console.graph(stats[i].data, 0, i);
                        }
                    }
                }
            }
        }

        function clearStats(name, statName) {
            statsData[name][statName].clear();
        }

        debugItem.prototype.stat = stat;
        debugItem.prototype.getStats = getStats;
        debugItem.prototype.flushStats = flushStats;

        model.stats = liveStats;
        model.getStats = function () {
            return statsData;
        };
        model.logStats = logStats;
        model.clearStats = clearStats;
        return model;
    }

    return statsBehavior;
});