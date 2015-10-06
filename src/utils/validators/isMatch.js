define('isMatch', ['isRegExp', 'isDate'], function (isRegExp, isDate) {

    var primitive = ["string", "number", "boolean"];

    /**
     * @typedef {Function} isMatch
     * @description checks to see if item matches the pattern.
     * An object with strings, numbers, booleans, Arrays, or functions that evaluate the property
     * can be used to find a match in an object.
     * @param {String|Number|Boolean|Object|Array} item
     * @param {String|Number|Boolean|RegExp|Object|Array|Function} filterObj
     * @returns {Boolean}
     */
    function isMatch(item, filterObj) {
        var itemType;
        if (item === filterObj) {
            return true;
        } else if (typeof filterObj === "object") {
            // allow filter objects to have regexp values that will match against primitive values only
            itemType = typeof item;
            if (primitive.indexOf(itemType) !== -1) {
                if (isRegExp(filterObj) && !filterObj.test(item + '')) {
                    return false;
                } else if (isDate(filterObj)) {
                    if (isDate(item) && filterObj.getTime() === item.getTime()) {
                        return true;
                    }
                    return false;
                }
            }
            if (item instanceof Array && filterObj[0] !== undefined) {
                // make sure to use ary.length here incase the array changes while matching.
                for (var i = 0; i < item.length; i += 1) {
                    if (isMatch(item[i], filterObj[0])) {
                        return true;
                    }
                }
                return false;
            } else {
                for (var j in filterObj) {
                    if (filterObj.hasOwnProperty(j)) {
                        if (!item.hasOwnProperty(j)) {
                            return false;
                        }
                        if (!isMatch(item[j], filterObj[j])) {
                            return false;
                        }
                    }
                }
            }
            return true;
        } else if (typeof filterObj === 'function') {
            return !!filterObj(item);
        }
        return false;
    }

    return isMatch;

});

