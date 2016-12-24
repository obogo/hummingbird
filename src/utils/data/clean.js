define('object.clean', ['isObject', 'isArray'], function(isObject, isArray) {
    /**
     * @param {Object} obj
     * @param {Boolean=false} deep
     * @param {Array=} valuesToClear
     */
    function clean(obj, deep, valuesToClear) {
        if (!isObject) {
            return;
        }
        var cleans = [null, undefined].concat(valuesToClear || []);
        var propNames = Object.getOwnPropertyNames(obj);
        for (var i = 0; i < propNames.length; i++) {
            var propName = propNames[i];
            if (deep) {
                if (isArray(obj[propName])) {
                    for(var k = 0; k < obj[propName].length; k += 1) {
                        clean(obj[propName][k], deep, valuesToClear);
                    }
                } else if (isObject(obj[propName])) {
                    clean(obj[propName], deep, valuesToClear);
                }
            }
            for(var j = 0; j < cleans.length; j += 1) {
                if (obj[propName] === cleans[i]) {
                    delete obj[propName];
                }
            }
        }
    }
    return clean;
});