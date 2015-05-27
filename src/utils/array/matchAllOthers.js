/**
 * matchAllOthers(array, *values)
 * Returns a copy of the array with all instances of the values removed.
 * @param p
 */

define('matchAllOthers', ['isMatch'], function (isMatch) {

    function matchAllOthers(ary, filterObj) {
        var result = [];
        for (var i = 0, len = ary.length; i < len; i += 1) {
            if (!isMatch(ary[i], filterObj)) {
                result.push(ary[i]);
            }
        }
        return result;
    }

    return matchAllOthers;

});
