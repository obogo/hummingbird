define('fromCamelToDash', function () {
    var rx = /([A-Z])/g;
    var dash = '-';
    function fn(g) {
        return dash + g.toLowerCase();
    }
    return function (str) {
        return str.replace(rx, fn);
    };
});