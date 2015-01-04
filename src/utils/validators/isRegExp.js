/**
 * Determines if a value is a regular expression object.
 *
 * @private
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `RegExp`.
 */
define('isRegExp', function () {
    var isRegExp = function (value) {
        return Object.prototype.toString.call(value) === '[object RegExp]';
    };
    return isRegExp;
});