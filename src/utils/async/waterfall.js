/**
 * Performs asynchronous calls to an array of callbacks
 * @param args
 * @param callbacks
 * @param resultHandler
 * @deps formatters.argsToArray
 */

define('waterfall', ['toArray'], function (toArray) {

    var waterfall = function (args, callbacks, resultHandler) {
        function callback() {
            if (callbacks.length) {
                var cb = callbacks.shift();
                cb.apply(null, toArray(arguments).concat(callback));
            } else {
                var args = toArray(arguments);
                args.unshift(null);
                if (resultHandler) {
                    resultHandler.apply(null, args);
                }
            }
        }

        args = args || [];
        callback.apply(null, args.concat(callback));
    };

    return waterfall;

});
