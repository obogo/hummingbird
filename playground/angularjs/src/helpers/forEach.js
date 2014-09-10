/* global validators, helpers */
helpers.forEach = function (obj, iterator, context) {
    var key, length, returnVal;
    if (obj) {
        if (validators.isFunction(obj)) {
            for (key in obj) {
                // Need to check if hasOwnProperty exists,
                // as on IE8 the result of querySelectorAll is an object without a hasOwnProperty function
                if (key !== 'prototype' && key !== 'length' && key !== 'name' && (!obj.hasOwnProperty || obj.hasOwnProperty(key))) {
                    if (iterator.call(context, obj[key], key) === false) {
                        break;
                    }
                }
            }
        } else if (validators.isArray(obj) || validators.isArrayLike(obj)) {
            for (key = 0, length = obj.length; key < length; key++) {
                if (iterator.call(context, obj[key], key) === false) {
                    break;
                }
            }
        } else if (obj.forEach && obj.forEach !== helpers.forEach) {
            return obj.forEach(iterator, context);
        } else {
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (iterator.call(context, obj[key], key) === false) {
                        break;
                    }
                }
            }
        }
    }
    return obj;
};