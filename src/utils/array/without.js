/**
 * Sort the array based on a property in the items.
 * pass desc if you want to reverse the sort.
 * @param p
 */

define('without', ['isMatch'], function (isMatch) {

    function without(ary, filterObj) {
        var result = [];
        for(var i = 0, len = ary.length; i < len; i += 1) {
            if (!isMatch(ary[i], filterObj)) {
                result.push(ary[i]);
            }
        }
        return result;
    }

    return without;

});
