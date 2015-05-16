define('hb.debug.logs', ['hb.debug.item', 'hb.debug.colors', 'apply'], function (debugItem, colors, apply) {

    function logger(model) {
        var logs = {};

        function register(name, color) {
            logs[name] = logs[name] || new debugItem(name, color);
            return logs[name];
        }

        function enable(name) {
            var success = false, a;
            for (var i = 0, len = arguments.length; i < len; i += 1) {
                a = arguments[i];
                if (logs[a]) {
                    logs[a].enabled = success = true;
                }
            }
            return success;
        }

        function log() {
            if (model.enabled && this.enabled) {
                var args = Array.prototype.slice.call(arguments);
                var n = this.name;
                args = ["%c" + n + "::", "color:" + this.color].concat(args);
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

        // debug model.

        debugItem.prototype.log = logMethodFactory('log');
        debugItem.prototype.info = logMethodFactory('info');
        debugItem.prototype.warn = logMethodFactory('warn');
        debugItem.prototype.error = logMethodFactory('error');

        model.log = enable;
        model.enabled = true;
        model.register = register;
        return model;
    }

    return logger;
});