// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeOutSine', function () {
    return function (x, t, b, c, d) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b;
    };
});