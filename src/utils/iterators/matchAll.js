define('matchAll', ['isMatch'], function (isMatch) {
    /**
     * @typedef {Function} matchAll
     * @description returns an array of all objects that match.
     * @param {Array.<String|Number|Boolean|Object|Array>} ary
     * @param {String|Number|Boolean|RegExp|Object|Array|Function} filterObj
     * @returns {Array.<String|Number|Boolean|Object|Array>}
     */
    function matchAll(ary, filterObj) {
        var result = [];
        // make sure to use ary.length here incase the array changes while matching.
        for (var i = 0; i < ary.length; i += 1) {
            if (isMatch(ary[i], filterObj)) {
                result.push(ary[i]);
            }
        }
        return result;
    }

    return matchAll;

});
