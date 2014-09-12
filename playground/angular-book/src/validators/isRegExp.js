/**
 * Determines if a value is a regular expression object.
 *
 * @private
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `RegExp`.
 */
validators.isRegExp = function (value) {
    return formatters.toString.call(value) === '[object RegExp]';
};