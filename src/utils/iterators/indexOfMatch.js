/**
 * Sort the array based on a property in the items.
 * pass desc if you want to reverse the sort.
 * @param p
 */

define('indexOfMatch', ['isMatch'], function (isMatch) {

    function indexOfMatch(ary, filterObj) {
        for(var i = 0, len = ary.length; i < len; i += 1) {
            if (isMatch(ary[i], filterObj)) {
                return i;
            }
        }
        return -1;
    }

    return indexOfMatch;

});
