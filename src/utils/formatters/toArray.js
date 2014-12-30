/**
 * @deps utils.validators.isArray, validators.isUndefined
 * @param value
 * @returns {*}
 */
define('toArray', ['isArguments', 'isArray', 'isUndefined'], function (isArguments, isArray, isUndefined) {
    var toArray = function (value) {
        if (isArguments(value)) {
            return Array.prototype.slice.call(value, 0) || [];
        }
        try {
            if (isArray(value)) {
                return value;
            }
            if (!isUndefined(value)) {
                return [].concat(value);
            }
        } catch (e) {
        }

        return [];
    };
    return toArray;
});
