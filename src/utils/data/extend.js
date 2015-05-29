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
define('extend', ['toArray'], function (toArray) {
    var extend = function (target, source) {
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
                    if (j === "length" && target instanceof Array) {
                        // do not set array length properties.
                    } else if (target[j] && typeof target[j] === 'object' && !item[j] instanceof Array) {
                        target[j] = extend.apply(options, [target[j], item[j]]);
                    } else if (item[j] instanceof Array) {
                        // by putting them all in copy. Wea are able to also convert it to an object as well as concat.
                        copy = options && options.concat ? (target[j] || []).concat(item[j]) : item[j];
                        if (options && options.arrayAsObject) {
                            if (!target[j]) {
                                target[j] = {length: copy.length};
                            }
                            if (target[j] instanceof Array) {
                                target[j] = extend.apply(options, [{}, target[j]]);
                            }
                        } else {
                            target[j] = target[j] || [];
                        }
                        if (copy.length) {
                            target[j] = extend.apply(options, [target[j], copy]);
                        }
                    } else if (item[j] && typeof item[j] === 'object') {
                        if (options.objectAsArray && typeof item[j].length === "number") {
                            if (!(target[j] instanceof Array)) {
                                target[j] = extend.apply(options, [[], target[j]]);
                            }
                        }
                        target[j] = extend.apply(options, [target[j] || {}, item[j]]);
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
