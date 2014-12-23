/**
 * Returns an object, if the item is string, number or boolean it will
 * return an object with the value set as the property "value" in the object
 *
 * @deps utils.validators.isUndefined, validators.isObject
 * @param value
 * @return {*}
 */
define('toObject', ['isUndefined', 'isObject'], function (isUndefined, isObject) {
    var toObject = function (value) {
        if (isUndefined(value)) {
            return {};
        }
        if (isObject(value)) {
            return value;
        }
        return {
            value: value
        };
    };
    return toObject;
});

