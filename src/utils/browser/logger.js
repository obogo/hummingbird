define('logger', function() {
    function logger(name, color) {
        return function() {
            if (!logger.enabled) {
                return;
            }
            var args = Array.prototype.slice.call(arguments);
            var tabs = '';
            var arg1 = args[0];
            var str = (arg1.stack || arg1.backtrace || arg1.stacktrace || arg1) + '';
            str.replace(/^\t+/, function(m) {
                tabs = m;
                return '';
            });
            args[0] = "%c" + tabs + name + "::" + str;
            args.splice(1, 0, "color:" + color +";");
            console.log.apply(console, args);
        };
    }
    logger.enabled = true;
    return logger;
});