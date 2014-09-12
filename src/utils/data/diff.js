utils.data.diff = function (source, target) {
    var returnVal = {}, dateStr;
    for (var name in target) {
        if (name in source) {
            if (utils.validators.isDate(target[name])) {
                dateStr = utils.validators.isDate(source[name]) ? source[name].toISOString() : source[name];
                if (target[name].toISOString() !== dateStr) {
                    returnVal[name] = target[name];
                }
            } else if (utils.validators.isObject(target[name]) && !utils.validators.isArray(target[name])) {
                var diff = data.diff(source[name], target[name]);
                if (!utils.validators.isEmpty(diff)) {
                    returnVal[name] = diff;
                }
            } else if (!utils.validators.isEqual(source[name], target[name])) {
                returnVal[name] = target[name];
            }
        } else {
            returnVal[name] = target[name];
        }
    }

    if (utils.validators.isEmpty(returnVal)) {
        return null;
    }
    return returnVal;
}