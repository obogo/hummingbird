define('isEmpty', ['isString', 'isArray', 'isObject'], function (isString, isArray, isObject) {

    var isEmpty = function (val) {
        if (val === null) {// diff returns null when they are empty.
            return true;
        }

        if (isString(val)) {
            return val === '';
        }

        if (isArray(val)) {
            return val.length === 0;
        }

        if (isObject(val)) {
            for (var e in val) {
                return false;
            }
            return true;
        }

        return false;
    };

    return isEmpty;

});
