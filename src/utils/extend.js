/**
 * Perform a deep extend.
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
        var options = this || {};
        while (i < len) {
            item = args[i];
            for (j in item) {
                if (item.hasOwnProperty(j)) {
                    if (target[j] && typeof target[j] === 'object' && !item[j] instanceof Array) {
                        target[j] = extend.apply(options, [target[j], item[j]]);
                    } else if (item[j] instanceof Array) {
                        target[j] = target[j] || (options && options.arrayAsObject ? {length: item[j].length} : []);
                        if (item[j].length) {
                            target[j] = extend.apply(options, [target[j], item[j]]);
                        }
                    } else if (item[j] && typeof item[j] === 'object') {
                        if (options.objectsAsArray && typeof item[j].length === "number") {
                            if (!(target[j] instanceof Array)) {
                                target[j] = [];
                            }
                        }
                        target[j] = extend.apply(options, [target[j] || {}, item[j]]);
                    } else {
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
