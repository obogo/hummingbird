// t: current time, b: begInnIng value, c: change In value, d: duration
define('easeInOutBounce', ['easeInBounce', 'easeOutBounce'], function (easeInBounce, easeOutBounce) {
    return function (x, t, b, c, d) {
        if (t < d / 2) return easeInBounce(x, t * 2, 0, c, d) * .5 + b;
        return easeOutBounce(x, t * 2 - d, 0, c, d) * .5 + c * .5 + b;
    };
});