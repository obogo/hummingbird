/**
 * matchIndexOf returns the match index of the first item it matches.
 * @param {Array} list
 * @param {*} item
 */

define('matchIndexOf', ['isMatch'], function (isMatch) {

    function matchesAny(list, item) {
        for (var i = 0, len = list.length; i < len; i += 1) {
            if (isMatch(list[i], item)) {
                return i;
            }
        }
        return -1;
    }

    return matchesAny;

});
