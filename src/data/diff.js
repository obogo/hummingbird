data.diff = function (source, target) {
    var returnVal = {}, dateStr;
    for (var name in target) {
        if (name in source) {
            if (validators.isDate(target[name])) {
                dateStr = validators.isDate(source[name]) ? source[name].toISOString() : source[name];
                if (target[name].toISOString() !== dateStr) {
                    returnVal[name] = target[name];
                }
            } else if (validators.isObject(target[name]) && !validators.isArray(target[name])) {
                var diff = data.diff(source[name], target[name]);
                if (!validators.isEmpty(diff)) {
                    returnVal[name] = diff;
                }
            } else if (!validators.isEqual(source[name], target[name])) {
                returnVal[name] = target[name];
            }
        } else {
            returnVal[name] = target[name];
        }
    }

    if (validators.isEmpty(returnVal)) {
        return null;
    }
    return returnVal;
}