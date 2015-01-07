internal('hb.directive', function () {
    var cache = {};

    var directive = function (name, fn) {
        if (typeof fn === 'undefined') {
            return cache[name];
        }
        cache[name] = fn;
    };
    directive.init = function (app) {
        for (var name in cache) {
            app.directive(name, cache[name]);
        }
    };

    return directive;
});