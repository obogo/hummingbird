/**
 * Iterates over a list of elements, yielding each in turn to an iteratee function.
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
        var params, handler, done;
        if(typeof arguments[1] === 'function') {
            handler = arguments[1];
            done = arguments[2];
        } else {
            params = arguments[1] || {};
            handler = arguments[2];
            done = arguments[3];
        }

        // var fnDesc = handler.toString();
        var next;
        var index = 0;
        var returnVal;
        var paramNames = getParamNames(handler);

        // allow params to modify the loop directly if they have a = in front of them.
        // start the loop part way through or so on.
        // Future feature: to have it set the starting index.
        //if (params && params['=index']) {
        //    index = params['=index'];
        //}

        var iterate = function () {
            // use list length. in case they remove or add items.
            if (index < list.length) {
                try {
                    if(params) {
                        returnVal = handler(list[index], index, list, params, next);
                    } else {
                        returnVal = handler(list[index], index, list, next);
                    }
                } catch(e) {
                    return done && done(e, list, params);
                }
                // if return true then exit the loop.
                if (returnVal !== undefined) {
                    iterate = null;
                    return done && done(returnVal, list, params);
                }
                if (!next) {
                    index += 1;// only if synchronous increment here.
                    iterate();
                }
            } else if (typeof done === 'function') {
                iterate = null;
                done(null, list, params);
            }
        };

        var now = Date.now();
        /**
         * Allow to process withing a ms threshold.
         * Example would be iterate as many as possible within a 10ms threshold.
         * This makes the async loop faster than 1 frame wait for each item with a 0 timeout.
         * @param {Number=} threshold
         */
        function iter(threshold) {
            var current;
            index += 1;// if asynchronous increment here.
            if (threshold) {
                current = Date.now();
                if(current < now + threshold) {
                    current = Date.now();
                    iterate();
                    return;
                }
                now = current;
            }
            setTimeout(iterate, 0);
        }

        if(params) {
            if(paramNames.length === 5) {
                next = iter;
            }
        } else {
            if(paramNames.length === 4) {
                next = iter;
            }
        }

        iterate();
    }

    return each;
});
