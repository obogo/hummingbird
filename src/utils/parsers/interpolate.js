define('interpolate', function () {
    var interpolate = function (scope, src) {
        var fn = Function;
        var result;
        try {
            result = (new fn('return ' + src)).apply(scope); // execute script in private context
            if (result + '' === 'NaN') {
                result = '';
            }
        } catch(e) {
            result = '';
        }
        return result;
    };
    return interpolate;
});