// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeInOutQuad', function () {
    return function (x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t + b;
        return -c / 2 * ((--t) * (t - 2) - 1) + b;
    };
});