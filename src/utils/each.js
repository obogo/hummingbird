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
(function () {
    function applyMethod(scope, method, item, index, list, extraArgs, all) {
        var args = all ? [item, index, list] : [item];
        return method.apply(scope, args.concat(extraArgs));
    }
    utils.each = function (list, method) {
        var i = 0, len, result, extraArgs;
        if (arguments.length > 2) {
            extraArgs = Array.prototype.slice.apply(arguments);
            extraArgs.splice(0, 2);
        }
        if (utils.validators.isFunction(list)) {
            for (i in list) {
                // Need to check if hasOwnProperty exists,
                // as on IE8 the result of querySelectorAll is an object without a hasOwnProperty function
                if (i !== 'prototype' && i !== 'length' && i !== 'name' && (!list.hasOwnProperty || list.hasOwnProperty(i))) {
                    result = applyMethod(this.scope, method, list[i], i, list, extraArgs, this.all);
//                    result = method.apply(this.scope, (this.all ? [list[i], i, list] : [list[i]]).concat(extraArgs));
                }
            }
        }
        if (list && list.length && list.hasOwnProperty(0)) {
            len = list.length;
            while (i < len) {
                result = applyMethod(this.scope, method, list[i], i, list, extraArgs, this.all);
//                result = method.apply(this.scope, (this.all ? [list[i], i, list] : [list[i]]).concat(extraArgs));
                if (result !== undefined) {
                    return result;
                }
                i += 1;
            }
        } else if (!(list instanceof Array) && list.length === undefined) {
            for (i in list) {
                if (list.hasOwnProperty(i) && (!this.omit || !this.omit[i])) {
                    result = applyMethod(this.scope, method, list[i], i, list, extraArgs, this.all);
//                    result = method.apply(this.scope, (this.all ? [list[i], i, list] : [list[i]]).concat(extraArgs));
                    if (result !== undefined) {
                        return result;
                    }
                }
            }
        }
        return list;
    };
}());