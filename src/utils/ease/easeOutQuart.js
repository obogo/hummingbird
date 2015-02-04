// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeOutQuart', function () {
    return function (x, t, b, c, d) {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b;
    };
});