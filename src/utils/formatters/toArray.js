/**
 * @deps utils.validators.isArray, validators.isUndefined
 * @param value
 * @returns {*}
 */
utils.formatters.toArray = function (value) {
    try {
        if (utils.validators.isArray(value)) {
            return value;
        }
        if (!validators.isUndefined(value)) {
            return [].concat(value);
        }
    } catch (e) {
    }

    return [];
}