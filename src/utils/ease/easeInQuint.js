// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeInQuint', function () {
    return function (x, t, b, c, d) {
        return c * (t /= d) * t * t * t * t + b;
    };
});