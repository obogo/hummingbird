/**
 * Sort the array based on a property in the items.
 * pass desc if you want to reverse the sort.
 * @param p
 */

define('sortOn', ['sort'], function (sort) {

    var sortOn = function (array, property, desc) {
        if (desc) {
            desc = 1;
        } else {
            desc = 0;
        }
        var sortfunc = function (a, b) {// handle both numbers and strings.
            return desc ? (b[property] > a[property] ? 1 : (a[property] > b[property] ? -1 : 0)) : (b[property] < a[property] ? 1 : (a[property] < b[property] ? -1 : 0));
        };
        return sort(array, sortfunc);
    };

    return sortOn;

});
