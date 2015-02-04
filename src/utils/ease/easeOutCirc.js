// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeOutCirc', function () {
    return function (x, t, b, c, d) {
        return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
    };
});
