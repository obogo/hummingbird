/* global validators */
var Collection = (function () {

//    function isArrayLike(obj) {
//        if (obj === null || obj === undefined) {
//            return false;
//        }
//        var length = obj.length;
//        return typeof length === 'number';
//    }

    function Collection(scope) {
    }

    Collection.prototype.$watchCollection = function (scope, watchFn, listenerFn) {
        var newValue;
        var oldValue;
        var oldLength;
        var veryOldValue;
        var trackVeryOldValue = (listenerFn.length > 1);
        var changeCount = 0;
        var _ = validators;
        var internalWatchFn = function (scope) {
            var newLength, i, bothNaN;
            newValue = watchFn(scope);
            if (_.isObject(newValue)) {
                if (_.isArrayLike(newValue)) {
                    if (!_.isArray(oldValue)) {
                        changeCount++;
                        oldValue = [];
                    }

                    if (newValue.length !== oldValue.length) {
                        changeCount++;
                        oldValue.length = newValue.length;
                    }

                    var newItem;
                    for (i in newValue) {
//                        if (newValue.hasOwnProperty(i)) {
                        newItem = newValue[i];
                        bothNaN = isNaN(newItem) && isNaN(oldValue[i]);
                        if (!bothNaN && newItem !== oldValue[i]) {
                            changeCount++;
                            oldValue[i] = newItem;
                        }
//                        }
                    }

                } else {
                    if (!_.isObject(oldValue) || _.isArrayLike(oldValue)) {
                        changeCount++;
                        oldValue = {};
                        oldLength = 0;
                    }

                    newLength = 0;

                    var newVal;
                    for (i in newValue) {
                        if (newValue.hasOwnProperty(i)) {
                            newLength++;
                            newVal = newValue[i];
                            if (oldValue.hasOwnProperty(i)) {
                                bothNaN = isNaN(newVal) && isNaN(oldValue[i]);
                                if (!bothNaN && oldValue[i] !== newVal) {
                                    changeCount++;
                                    oldValue[i] = newVal;
                                }
                            } else {
                                changeCount++;
                                oldLength++;
                                oldValue[i] = newVal;
                            }
                        }
                    }

                    if (oldLength > newLength) {
                        changeCount++;
                        var oldVal;
                        for (i in oldValue) {
                            oldVal = oldValue[i];
                            if (!newValue.hasOwnProperty(i)) {
                                oldLength--;
                                delete oldValue[i];
                            }
                        }
                    }
                }
            } else {
                if (!scope.$$areEqual(newValue, oldValue, false)) {
                    changeCount++;
                }
                oldValue = newValue;
            }

            return changeCount;
        };

        var internalListenerFn = function () {
            listenerFn(newValue, veryOldValue, scope);
            if(trackVeryOldValue) {
                // clone
                veryOldValue = JSON.parse(JSON.stringify(newValue));
            }
        };
        return scope.$watch(internalWatchFn, internalListenerFn);
    };

    return Collection;

})();
