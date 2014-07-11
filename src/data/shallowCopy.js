/**
 * Creates a shallow copy of an object, an array or a primitive
 *
 * @deps validators.isArray, validators.isObject
 * @param src
 * @param dest
 * @returns {*}
 */
data.shallowCopy = function (src, dest, ignorePrefix) {
    if (validators.isArray(src)) {
        dest = dest || [];

        for (var i = 0; i < src.length; i++) {
            dest[i] = src[i];
        }
    } else if (validators.isObject(src)) {
        dest = dest || {};

        for (var key in src) {
            if (hasOwnProperty.call(src, key) && !(key.charAt(0) === ignorePrefix && key.charAt(1) === ignorePrefix)) {
                dest[key] = src[key];
            }
        }
    }

    return dest || src;
}