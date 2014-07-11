/**
 * Performs asynchronous calls to an array of callbacks
 * @param args
 * @param callbacks
 * @param resultHandler
 * @deps formatters.argsToArray
 */
async.waterfall = function(args, callbacks, resultHandler) {
    function callback() {
        if (callbacks.length) {
            var cb = callbacks.shift();
            cb.apply(null, formatters.toArgsArray(arguments).concat(callback));
        } else {
            var args = formatters.toArgsArray(arguments);
            args.unshift(null);
            if (resultHandler) {
                resultHandler.apply(null, args);
            }
        }
    }

    args = args || [];
    callback.apply(null, args.concat(callback));
}
