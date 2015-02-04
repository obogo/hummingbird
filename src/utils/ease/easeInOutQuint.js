// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeInOutQuint', function () {
    return function (x, t, b, c, d) {
        if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
        return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
    };
});