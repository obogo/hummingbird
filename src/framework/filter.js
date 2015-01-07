internal('hb.filter', function () {
    var cache = {};

    var filter = function (name, fn) {
        if (typeof fn === 'undefined') {
            return cache[name];
        }
        cache[name] = fn;
    };
    filter.init = function (app) {
        //for (var name in cache) {
        //    app.filter(name, cache[name]);
        //}
    };

    return filter;
});