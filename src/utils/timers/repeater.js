define('repeater', function () {

    var Repeater = function (delay, repeat, limit) {
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
                    callback();
                }
            }, scope.repeat);
            scope.check();
            if (isFunction) {
                callback();
            }
        }, scope.delay);
        scope.check();

        if (isFunction) {
            callback();
        }
    };

    p.stop = function () {
        var scope = this;
        clearTimeout(scope.t);
        clearInterval(scope.t);
    };

    return function () {
        return new Repeater();
    }

});