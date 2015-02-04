// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeInOutSine', function () {
    return function (x, t, b, c, d) {
        return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
    };
});