/**
 * Determines if a value is a regular expression object.
 *
 * @private
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `RegExp`.
 */
define('isRegExp', ['toString'], function () {
    var isRegExp = function (value) {
        return toString.call(value) === '[object RegExp]';
    };
    return isRegExp;
});