/**
 * ##ux.each##
 * Like angular.forEach except that you can pass additional arguments to it that will be available
 * in the iteration function. It is optimized to use while loops where possible instead of for loops for speed.
 * Like Lo-Dash.
 *
 * NOTE: if return anything other than an undefined the loop will exit and each will return that value instead of the array.
 * @param {Array\Object} list
 * @param {Function} method
 * @param {..rest} data _additional arguments passes are available in the iteration function_
 * @returns {*}
 */
//_example:_
//
//      function myMethod(item, index, list, arg1, arg2, arg3) {
//          console.log(arg1, arg2, arg3);
//      }
//      each(myList, myMethod, arg1, arg2, arg3);
//      // this way you can configure the each
//      or each.apply({scope: this}, [myList, myMethod, arg1, arg2, arg3]);
helpers.each = function(list, method) {
    var i = 0, len, result, extraArgs;
    if (arguments.length > 2) {
        extraArgs = Array.prototype.slice.apply(arguments);
        extraArgs.splice(0, 2);
    }
    if (list && list.length && list.hasOwnProperty(0)) {
        len = list.length;
        while (i < len) {
            result = method.apply(this.scope, [list[i], i, list].concat(extraArgs));
            if (result !== undefined) {
                return result;
            }
            i += 1;
        }
    } else if (!(list instanceof Array)) {
        for (i in list) {
            if (list.hasOwnProperty(i) && (!this.omit || !this.omit[i])) {
                result = method.apply(this.scope, [list[i], i, list].concat(extraArgs));
                if (result !== undefined) {
                    return result;
                }
            }
        }
    }
    return list;
}