define('pluck', ['each'], function (each) {

    function onEach(item, index, list, params) {
        var value;
        if (item.hasOwnProperty(params.prop) && (value = item[params.prop]) !== undefined) {
            if (!params.cache.hasOwnProperty(value)) {
                params.cache[value] = 1;
                params.result.push(value);
            }
        }
    }

    return function (list, propertyName) {
        return each(list, {result:[], cache:{}, prop:propertyName}, onEach).result;
    };
});