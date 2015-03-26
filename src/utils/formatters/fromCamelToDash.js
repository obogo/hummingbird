define('fromCamelToDash', function () {
    return function (str) {
        return str.replace(/([A-Z])/g, function (g) {
            return '-' + g.toLowerCase();
        });
    };
});