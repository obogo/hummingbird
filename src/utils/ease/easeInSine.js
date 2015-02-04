// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeInSine', function () {
    return function (x, t, b, c, d) {
        return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
    };
});