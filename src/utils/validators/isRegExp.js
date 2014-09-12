/**
 * Determines if a value is a regular expression object.
 *
 * @private
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `RegExp`.
 */
utils.validators.isRegExp = function (value) {
    return utils.formatters.toString.call(value) === '[object RegExp]';
}