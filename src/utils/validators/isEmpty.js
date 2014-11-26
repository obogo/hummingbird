utils.validators.isEmpty = function (val) {
    if (val === null) {// diff returns null when they are empty.
        return true;
    }

    if (utils.validators.isString(val)) {
        return val === '';
    }

    if (utils.validators.isArray(val)) {
        return val.length === 0;
    }

    if (utils.validators.isObject(val)) {
        for (var e in val) {
            return false;
        }
        return true;
    }

    return false;
};