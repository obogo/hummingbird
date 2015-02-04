// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeInCirc', function () {
    return function (x, t, b, c, d) {
        return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
    };
});