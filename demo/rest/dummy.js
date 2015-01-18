(function (exports) {
    //var queue = exports.q || exports;
    //if (exports.hasOwnProperty("q")) {
    //    exports = window["myapi"] = function () {
    //        var args = Array.prototype.slice.call(arguments);
    //        var method = args.shift();
    //        if (exports.hasOwnProperty(method)) {
    //            exports[method].apply(exports, args);
    //        }
    //    };
    //}

    exports.on = function (evt, callback) {
        callback();
    };



})(window.hb);