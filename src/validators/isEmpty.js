var isEmpty = function isEmpty(val) {
    if (_.isString(val)) {
        return val === '';
    }

    if (_.isArray(val)) {
        return val.length === 0;
    }

    if (_.isObject(val)) {
        for (var e in val) {
            return false;
        }
        return true;
    }

    return false;
};