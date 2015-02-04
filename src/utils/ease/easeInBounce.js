// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeInBounce', ['easeOutBounce'], function (easeOutBounce) {
    return function (x, t, b, c, d) {
        return c - easeOutBounce(x, d - t, 0, c, d) + b;
    };
});