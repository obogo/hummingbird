define('interpolate', function () {
    /**
     *
     * @param {String} src
     * @param {Object=} scope
     * @returns {*}
     */
    var interpolate = function (src, scope) {
        scope = scope || {};
        var fn = Function;
        var result;
        try {
            result = (new fn('return ' + src)).call(scope); // execute script in private context
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