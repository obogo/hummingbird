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
        var len = list.length;
        var index = 0;
        var returnVal;
        var paramNames = getParamNames(handler);

        var iterate = function () {
            if (index < len) {
                try {
                    if(params) {
                        returnVal = handler(list[index], index, list, params, next);
                    } else {
                        returnVal = handler(list[index], index, list, next);
                    }
                } catch(e) {
                    return done && done(e);
                }

                if (returnVal !== undefined) {
                    iterate = null;
                    return done(returnVal);
                }
                index += 1;
                if (!next) {
                    iterate();
                }
            } else if (typeof done === 'function') {
                iterate = null;
                done();
            }
        };

        if(params) {
            if(paramNames.length === 5) {
                next = function () {
                    setTimeout(iterate, 0);
                };
            }
        } else {
            if(paramNames.length === 4) {
                next = function() {
                    setTimeout(iterate, 0);
                };
            }
        }

        iterate();
    }

    return each;
});
