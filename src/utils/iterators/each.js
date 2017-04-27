/**
 * Iterates over a list of elements, yielding each in turn to an iterate function.
 */

//var arr = ['a','b','c'];
//
//each(arr, function(item, index, list) {
//    console.log('VAL >', item, index, list);
//});
//
//each(arr, {name: "John"}, function(item, index, list, params, next) {
//    console.log('ITEM >', item, index, list, params)
//    next();
//}, function(err){
//    if(err) {
//        console.log('err', err);
//        return;
//    }
//    console.log('done');
//});
define('each', function () {

    var regex = /([^\s,]+)/g;

    function getParamNames(fn) {
        var funStr = fn.toString();
        return funStr.slice(funStr.indexOf('(') + 1, funStr.indexOf(')')).match(regex);
    }

    function each(list) {
        var params, handler, done, progress;
        if(typeof arguments[1] === 'function') {
            handler = arguments[1];
            done = arguments[2];
            progress = arguments[2];
        } else {
            params = arguments[1] === null || arguments[1] === undefined ? {} : arguments[1];
            handler = arguments[2];
            done = arguments[3];
            progress = arguments[4];
        }

        if (!list) {
            if (done) {
                done(undefined, list, params);// we complete immediately if there is no list.
            }
            return;
        }

        // var fnDesc = handler.toString();
        var next;
        var index = 0;
        var returnVal;
        var paramNames = getParamNames(handler);
        var keys;
        var len;

        if (list.length === undefined) {
            keys = Object.keys(list);
            len = keys.length;
        }

        // allow params to modify the loop directly if they have a = in front of them.
        // start the loop part way through or so on.
        // Future feature: to have it set the starting index.
        //if (params && params['=index']) {
        //    index = params['=index'];
        //}

        var iterate = function () {
            // use list length. in case they remove or add items.
            len = keys ? len : list.length;
            if (index < len) {
                try {
                    if(params) {
                        returnVal = handler(keys ? list[keys[index]] : list[index], keys ? keys[index] : index, list, params, next);
                    } else {
                        returnVal = handler(keys ? list[keys[index]] : list[index], keys ? keys[index] : index, list, next);
                    }
                } catch(e) {
                    if (done) {
                        done(e, list, params);
                    } else {
                        throw e;// non async methods need to show the error.
                    }
                }
                // if return true then exit the loop.
                if (returnVal !== undefined) {
                    iterate = null;
                    if (done) {
                        done(returnVal, list, params);
                        return;
                    }
                    return returnVal;
                }
                if (!next) {
                    index += 1;// only if synchronous increment here.
                    iterate();
                }
            } else if (typeof done === 'function') {
                iterate = null;
                done(null, list, params);
            }
            return returnVal;
        };

        var now = Date.now();
        var limitIndex = 0;
        /**
         * Allow to process withing a ms threshold.
         * Example would be iterate as many as possible within a 10ms threshold.
         * This makes the async loop faster than 1 frame wait for each item with a 0 timeout.
         * @param {Number=} threshold
         * @param {Number=} max number of items to process before coming up for air.
         */
        function iter(threshold, limit) {
            var current;
            index += 1;// if asynchronous increment here.
            if (threshold || limit) {
                limit = limit || 500;
                current = Date.now();
                if (current < now + threshold && (!limit || index - limitIndex < limit)) {
                    iterate();
                    return;
                }
                if (progress) {
                    progress(index, len);
                }
                limitIndex = index;
                now = current;
            }
            setTimeout(iterate, 0);
        }

        if(params) {
            if(paramNames && paramNames.length === 5) {
                next = iter;
            }
        } else {
            if(paramNames && paramNames.length === 4) {
                next = iter;
            }
        }

        var syncReturnVal = iterate();
        if (syncReturnVal !== undefined) {
            return syncReturnVal;
        }
        if (!done && params) {
            return params;
        }
    }

    return each;
});
