// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeOutExpo', function () {
    return function (x, t, b, c, d) {
        return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
    };
});