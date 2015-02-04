// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeOutBack', function () {
    return function (x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
    };
});