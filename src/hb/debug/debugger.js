//! pattern /hb\-debugger(\s|\=|>)/
internal('hbd.debugger', ['hb.directive', 'benchmark', 'lpad', 'rpad'], function (directive, benchmark, lpad, rpad) {
    var deb;

    function Debugger() {
        this.nameLength = 50;
    }

    directive('hbDebugger', function () {
        return {
            link: function (scope, $app) {

                function getEl(scope) {
                    return document.querySelector("[" + $app.name + "-id='" + scope.$id + "']");
                }


                // put the method on the scope to capture the benchmark.
                function mark(watcher, scope, newValue, oldValue) {
                    var fnName = benchmark.getClassName(watcher.listenerFn);
                    var key = scope.$id + (watcher.expr && '.$watch("' + watcher.expr + '", ' + (fnName || '') + ')');
                    watcher.listenerFnStr = watcher.listenerFnStr || watcher.listenerFn.toString();
                    benchmark.start(key, {scope: scope, fn: watcher.listenerFnStr});
                    watcher.listenerFn(newValue, oldValue, scope);
                    benchmark.stop(key);
                }

                function renderer(data) {
                    var item, i, j, len, jLen = data[0] && data[0].color.length, name;
                    console.group("Benchmark");
                    for (i = 0, len = data.length; i < len; i += 1) {
                        item = data[i];
                        name = rpad(item.name, ' ', deb.nameLength);
                        if (name.length > deb.nameLength) {
                            name = name.substr(0, deb.nameLength - 3) + '...';
                        }
                        console.groupCollapsed("%c", "border-left: 4px solid " + item.color[2] + ";border-right: 4px solid " + item.color[3] + ";",
                            name, lpad(item.value[0] + 'x', ' ', 5), lpad('avg:' + (Math.floor(item.value[2] * 1000)/1000).toFixed(3) + 'ms', ' ', 16));
                        var right = item.value[1] - item.value[3];
                        var diff = item.value[1] - right;
                        console.log("%c", "border-left:" + (Math.ceil(diff / 10) || 1) + "px solid " + item.color[3] + ";border-right:" + (Math.ceil(right / 10) || 1) + "px solid " + item.color[1] + ";", "largest:" + (Math.floor(item.value[3] * 1000)/1000) + "/total:" + (Math.floor(item.value[1] * 1000)/1000));
                        if (item.message && item.message.scope) {
                            item.message.el = getEl(item.message.scope);
                            console.log("%cdata %o", "font-weight:bold;", item.message);
                        }
                        console.groupEnd();
                    }
                    console.groupEnd();
                }

                function benchMarkRender(maxLen, minTotalMS) {
                    benchmark.threshold.maxLength = maxLen || 10;
                    benchmark.threshold.totalTime = minTotalMS || 1;
                    benchmark.invalidate();
                    return '';
                }

                deb.getEl = getEl; // add the element lookup to the debugger.
                scope.$benchmark = mark;// make scope render.
                benchmark.renderer = renderer;// override the default renderer.
                deb.render = benchMarkRender;
            }
        }
    });

    deb = new Debugger();
    exports.debugger = deb;// force exposure
    return deb;
});