/**
 * @param {*} obj
 * @return {boolean} Returns true if `obj` is an array or array-like object (NodeList, Arguments,
 *                   String ...)
 */
define('isArrayLike', ['isWindow', 'isString', 'isArray'], function (isWindow, isString, isArray) {

    var isArrayLike = function (obj) {
        if (obj === null || isWindow(obj)) {
            return false;
        }

        var length = obj.length;

        if (obj.nodeType === 1 && length) {
            return true;
        }

        return isString(obj) || isArray(obj) || length === 0 ||
            typeof length === 'number' && length > 0 && (length - 1) in obj;
    };

    return isArrayLike;

});
