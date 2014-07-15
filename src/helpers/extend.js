/**
 * ###<a name="extend">extend</a>###
 * Perform a deep extend.
 * @param {Object} destination
 * @param {Object=} source
 * return {Object|destination}
 */
// example
// This allows you to set flags as well as pass unlimited extend objects.
// extend.apply({objectsAsArray:true}, ob1, obj2);
//
function extend(destination, source) {
    var args = Array.prototype.slice.call(arguments, 0), i = 1, len = args.length, item, j;
    var options = this || {};
    while (i < len) {
        item = args[i];
        for (j in item) {
            if (item.hasOwnProperty(j)) {
                if (destination[j] && typeof destination[j] === 'object') {
                    destination[j] = extend.apply(options, [destination[j], item[j]]);
                } else if (item[j] instanceof Array) {
                    destination[j] = destination[j] || (options && options.arrayAsObject ? {length: item[j].length} : []);
                    if (item[j].length) {
                        destination[j] = extend.apply(options, [destination[j], item[j]]);
                    }
                } else if (item[j] && typeof item[j] === 'object') {
                    if (options.objectsAsArray && typeof item[j].length === "number") {
                        if (!(destination[j] instanceof Array)) {
                            destination[j] = [];
                        }
                    }
                    destination[j] = extend.apply(options, [destination[j] || {}, item[j]]);
                } else {
                    destination[j] = item[j];
                }
            }
        }
        i += 1;
    }
    return destination;
}