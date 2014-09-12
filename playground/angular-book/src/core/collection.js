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
        var changeCount = 0;
        var _ = validators;
        var internalWatchFn = function (scope) {
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
                    for (var i in newValue) {
                        if (newValue.hasOwnProperty(i)) {
                            newItem = newValue[i];
                            var bothNaN = isNaN(newItem) && isNaN(oldValue[i]);
                            if (!bothNaN && newItem !== oldValue[i]) {
                                changeCount++;
                                oldValue[i] = newItem;
                            }
                        }
                    }

                } else {
                    if (!_.isObject(oldValue) || _.isArrayLike(oldValue)) {
                        changeCount++;
                        oldValue = {};
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
            listenerFn(newValue, oldValue, scope);
        };
        return scope.$watch(internalWatchFn, internalListenerFn);
    };

    return Collection;

})();
