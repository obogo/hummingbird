/**
 * **filter** built on the same concepts as each. So that you can pass additional arguments.
 * It will filter both arrays and objects, the result is an array.
 * @param list
 * @param method
 * @param ...rest
 * @returns {Array}
 */
// example
// var evens = [];
// // You can pass as many arguments as you want, they just come after the item, index, and list.
// var odds = data.filter([1, 2, 3, 4, 5], function (item, index, list, evens) {
// if (item %2 == 0) evens.push(item);
//}, evens);
utils.data.filter = function(list, method /* ...rest*/) {
    var i = 0, len, result = [], extraArgs, response;
    if (arguments.length > 2) {
        extraArgs = Array.prototype.slice.apply(arguments);
        extraArgs.splice(0, 2);
    }
    if (list && list.length) {
        len = list.length;
        while (i < len) {
            response = method.apply(null, [ list[i], i, list ].concat(extraArgs));
            if (response) {
                result.push(list[i]);
            }
            i += 1;
        }
    } else {
        for (i in list) {
            if (list.hasOwnProperty(i)) {
                response = method.apply(null, [ list[i], i, list ].concat(extraArgs));
                if (response) {
                    result.push(list[i]);
                }
            }
        }
    }
    return result;
}