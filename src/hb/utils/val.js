internal('hb.val', function () {
    var cache = {};

    var val = function (name, fn) {
        if (typeof fn === 'undefined') {
            return cache[name];
        }
        cache[name] = fn;
    };
    val.init = function (app) {
        for (var name in cache) {
            app.val(name, cache[name]);
        }
    };

    return val;
});