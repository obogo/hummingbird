/**
 * Interpolates data within an scope of an object
 * @param scope
 * @param src
 * @returns {*}
 */
parsers.scopeEval = function (scope, src) {
    var fn = Function;
    var result = (new fn('with(this) { return ' + src + '}')).apply(scope); // execute script in private context
    if (result + '' === 'NaN') {
        result = '';
    }
    return result;
}