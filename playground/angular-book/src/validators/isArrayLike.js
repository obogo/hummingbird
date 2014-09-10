/**
 * @param {*} obj
 * @return {boolean} Returns true if `obj` is an array or array-like object (NodeList, Arguments,
 *                   String ...)
 */
/* global validators */
validators.isArrayLike = function (obj) {
    if (obj ===null || validators.isWindow(obj)) {
        return false;
    }

    var length = obj.length;

    if (obj.nodeType === 1 && length) {
        return true;
    }

    return validators.isString(obj) || validators.isArray(obj) || length === 0 ||
        typeof length === 'number' && length > 0 && (length - 1) in obj;
};