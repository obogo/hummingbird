/**
 * matchAllOthers(array, *values)
 * Returns a copy of the array with all instances of the values removed.
 * @param p
 */

define('matchAllOthers', ['matchIndexOf'], function (matchIndexOf) {

    function matchAllOthers(ary, filterObj) {
        var result = [], args = Array.prototype.slice.apply(arguments);
        args.shift();
        for (var i = 0, len = ary.length; i < len; i += 1) {
            if (matchIndexOf(args, ary[i]) === -1) {
                result.push(ary[i]);
            }
        }
        return result;
    }

    return matchAllOthers;

});
