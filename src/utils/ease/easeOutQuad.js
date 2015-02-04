// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeOutQuad', function () {
    return function (x, t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b;
    };
});