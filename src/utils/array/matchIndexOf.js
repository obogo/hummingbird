define('matchIndexOf', ['isMatch'], function (isMatch) {
    /**
     * @typedef {Function} matchIndexOf
     * @description matchIndexOf returns the match index of the first item it matches.
     * @param {Array.<String|Number|Boolean|Object|Array>} ary
     * @param {String|Number|Boolean|RegExp|Object|Array|Function} filterObj
     * @returns {Number}
     */
    function matchesAny(ary, filterObj) {
        for (var i = 0, len = ary.length; i < len; i += 1) {
            if (isMatch(ary[i], filterObj)) {
                return i;
            }
        }
        return -1;
    }

    return matchesAny;

});
