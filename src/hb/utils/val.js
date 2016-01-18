internal('hb.val', ['cache', 'each'], function (cache, each) {
    var $cache = cache();

    var val = function (name, fn) {
        if (!$cache.has(name)) {
            $cache.set(name, fn);
        }
    };

    val.init = function (app) {
        each($cache.all(), function (value, key) {
            app.val(key, value);
        });
        $cache.clear();
    };

    return val;
});