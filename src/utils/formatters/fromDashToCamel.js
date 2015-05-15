define('fromDashToCamel', function () {
    var rx = /-([a-z])/g;
    function fn(g) {
        return g[1].toUpperCase();
    }
    return function (str) {
        return str.replace(rx, fn);
    };
});