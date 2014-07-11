/**
 * @deps validators.isArray, validators.isUndefined
 * @param value
 * @returns {*}
 */
formatters.toArray = function (value) {
    try {
        if (validators.isArray(value)) {
            return value;
        }
        if (!validators.isUndefined(value)) {
            return [].concat(value);
        }
    } catch (e) {
    }

    return [];
}