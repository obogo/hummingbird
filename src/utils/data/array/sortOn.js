/**
 * Sort the array based on a property in the items.
 * pass desc if you want to reverse the sort.
 * This is dependent on sort.
 * @param p
 */
utils.data.array.sortOn = function (ary, p, desc) {
    if (desc) {
        desc = 1;
    } else {
        desc = 0;
    }
    var sortfunc = function (a, b) {// handle both numbers and strings.
        return desc ? (b[p] > a[p] ? 1 : (a[p] > b[p] ? -1 : 0)) : (b[p] < a[p] ? 1 : (a[p] < b[p] ? -1 : 0));
    };
    return data.array.sort(ary, sortfunc);
}