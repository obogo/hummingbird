hummingbird.utils.throttle = function (fn, delay) {
    var pause, args;
    return function () {
        if (pause) {
            args = arguments;
            return;
        }
        pause = 1;

        fn.apply(fn, arguments);

        setTimeout(function () {
            pause = 0;
            if (args) {
                fn.apply(fn, args);
            }
        }, delay);
    };
}