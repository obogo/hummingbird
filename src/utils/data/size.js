/* global validators */
/**
 * @description
 * Determines the number of elements in an array, the number of properties an object has, or
 * the length of a string.
 *
 * Note: This function is used to augment the Object type in Angular expressions. See
 * {@link angular.Object} for more information about Angular arrays.
 *
 * @param {Object|Array|string} obj Object, array, or string to inspect.
 * @param {boolean} [ownPropsOnly=false] Count only "own" properties in an object
 * @returns {number} The size of `obj` or `0` if `obj` is neither an object nor an array.
 */
define('size', ['isArray', 'isString', 'isObject'], function (isArray, isString, isObject) {

    var size = function (obj, ownPropsOnly) {
        var count = 0, key;

        if (isArray(obj) || isString(obj)) {
            return obj.length;
        } else if (isObject(obj)) {
            for (key in obj) {
                if (!ownPropsOnly || obj.hasOwnProperty(key)) {
                    count++;
                }
            }
        }

        return count;
    };

    return size;

});
