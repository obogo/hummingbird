define('repeater', function () {

    var Repeater = function (limit, delay, repeat) {
        var scope = this;
        scope.count = 0;
        scope.delay = delay || 300;
        scope.repeat = repeat || 50;
        scope.limit = limit || 0;
    };

    var p = Repeater.prototype;
    p.check = function () {
        var scope = this;
        scope.count += 1;
        if (scope.limit && scope.count >= scope.limit) {
            scope.stop();
        }
    };

    p.start = function (callback) {
        var scope = this;

        var isFunction = typeof callback;

        scope.count = 0;
        scope.t = setTimeout(function () {
            scope.t = setInterval(function () {
                scope.check();
                if (isFunction) {
                    callback(scope);
                }
            }, scope.repeat);
            scope.check();
            if (isFunction) {
                callback(scope);
            }
        }, scope.delay);
        scope.check();

        if (isFunction) {
            callback(scope);
        }
    };

    p.stop = function () {
        var scope = this;
        clearTimeout(scope.t);
        clearInterval(scope.t);
    };

    return function (limit, delay, repeat) {
        return new Repeater(limit, delay, repeat);
    };

});