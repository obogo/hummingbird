// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeInExpo', function () {
    return function (x, t, b, c, d) {
        return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
    };
});