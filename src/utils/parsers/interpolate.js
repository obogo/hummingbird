define('interpolate', function () {
    var interpolate = function (scope, src) {
        var fn = Function;
        var result = (new fn('return ' + src)).apply(scope); // execute script in private context
        if (result + '' === 'NaN') {
            result = '';
        }
        return result;
    };
    return interpolate;
});