define('diff', ['isDate', 'isObject', 'isEmpty', 'isArray'], function (isDate, isObject, isEmpty, isArray) {

    var diff = function (source, target) {
        var returnVal = {}, dateStr;
        for (var name in target) {
            if (name in source) {
                if (isDate(target[name])) {
                    dateStr = isDate(source[name]) ? source[name].toISOString() : source[name];
                    if (target[name].toISOString() !== dateStr) {
                        returnVal[name] = target[name];
                    }
                } else if (isObject(target[name]) && !isArray(target[name])) {
                    var result = diff(source[name], target[name]);
                    if (!isEmpty(result)) {
                        returnVal[name] = result;
                    }
                } else if (!isEqual(source[name], target[name])) {
                    returnVal[name] = target[name];
                }
            } else {
                returnVal[name] = target[name];
            }
        }

        if (isEmpty(returnVal)) {
            return null;
        }
        return returnVal;
    };

    return diff;

});
