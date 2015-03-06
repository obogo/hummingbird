define('isMatch', ['isRegExp'], function (isRegExp) {

    var primitive = ["string", "number", "boolean"];

    function isMatch(item, filterObj) {
        var itemType;
        if (item === filterObj) {
            return true;
        } else if (typeof filterObj === "object") {
            // allow filter objects to have regexp values that will match against primitive values only
            itemType = typeof item;
            if (primitive.indexOf(itemType) !== -1 && isRegExp(filterObj) && !filterObj.test(item + '')) {
                return false;
            }
            for (var j in filterObj) {
                if (filterObj.hasOwnProperty(j)) {
                    if (!isMatch(item[j], filterObj[j])) {
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    }

    return isMatch;

});

