/**
 * Returns an object, if the item is string, number or boolean it will
 * return an object with the value set as the property "value" in the object
 *
 * @deps utils.validators.isUndefined, validators.isObject
 * @param value
 * @return {*}
 */
utils.formatters.toObject = function (value) {
    if (validators.isUndefined(value)) {
        return {};
    }
    if (validators.isObject(value)) {
        return value;
    }
    return {
        value: value
    };
}