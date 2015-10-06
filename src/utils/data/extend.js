/**
 * Perform a deep extend. SEE extend_Spec.js for examples of options.
 * @param {Object} target
 * @param {Object=} source
 * return {Object|destination}
 */
// example
// This allows you to set flags as well as pass unlimited extend objects.
// extend.apply({objectsAsArray:true}, ob1, obj2);
//
define('extend', ['isWindow', 'apply', 'toArray', 'isArray', 'isDate', 'isRegExp'], function (isWindow, apply, toArray, isArray, isDate, isRegExp) {
    var extend = function (target, source) {
        if (isWindow(source)) {
            throw Error("Can't extend! Making copies of Window instances is not supported.");
        }
        if (source === target) {
            return target; // they are identical. Just return the reference.
        }
        var args = toArray(arguments), i = 1, len = args.length, item, j;
        var options = this || {},
            copy;
        if (!target && source && typeof source === 'object') {
            target = {};// handle if target is undefined, but there is data to extend.
        }
        while (i < len) {
            item = args[i];
            for (j in item) {
                if (item.hasOwnProperty(j)) {
                    if (isDate(item[j])) {
                        target[j] = new Date(item[j].getTime());
                    } else if (isRegExp(item[j])) {
                        target[j] = new RegExp(item[j]);
                    } else if (j === "length" && target instanceof Array) {
                        // do not set array length property.
                    } else if (target[j] && typeof target[j] === 'object' && !item[j] instanceof Array) {
                        target[j] = apply(extend, options, [target[j], item[j]]);
                    } else if (isArray(item[j])) {
                        // by putting them all in copy. Wea are able to also convert it to an object as well as concat.
                        copy = options && options.concat ? (target[j] || []).concat(item[j]) : item[j];
                        if (options && options.arrayAsObject) {
                            if (!target[j]) {
                                target[j] = {length: copy.length};
                            }
                            if (target[j] instanceof Array) {
                                target[j] = apply(extend, options, [{}, target[j]]);
                            }
                        } else {
                            target[j] = target[j] || [];
                        }
                        if (copy.length) {
                            target[j] = apply(extend, options, [target[j], copy]);
                        }
                    } else if (item[j] && typeof item[j] === 'object') {
                        if (options.objectAsArray && typeof item[j].length === "number") {
                            if (!(target[j] instanceof Array)) {
                                target[j] = apply(extend, options, [[], target[j]]);
                            }
                        }
                        target[j] = apply(extend, options, [target[j] || {}, item[j]]);
                    } else if (options.override !== false || target[j] === undefined) {
                        target[j] = item[j];
                    }
                }
            }
            i += 1;
        }
        return target;
    };

    return extend;
});
