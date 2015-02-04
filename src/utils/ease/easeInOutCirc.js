// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeInOutCirc', function () {
    return function (x, t, b, c, d) {
        if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
        return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
    };
});