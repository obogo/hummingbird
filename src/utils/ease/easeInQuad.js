// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeInQuad', function () {
    return function (x, t, b, c, d) {
        return c * (t /= d) * t + b;
    };
});
