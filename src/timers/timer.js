timers.Timer = function(delay, repeat, limit) {
    var count, t, scope = this;

    function check() {
        count++;
        if (scope.limit && count >= scope.limit) {
            stop();
        }
    }

    function start(callback) {
        count = 0;
        t = setTimeout(function () {
            t = setInterval(function () {
                check();
                callback();
            }, scope.repeat);
            check();
            callback();
        }, scope.delay);
        check();
        callback();
    }

    function stop() {
        clearTimeout(t);
        clearInterval(t);
    }

    this.delay = delay || 300;
    this.repeat = repeat || 50;
    this.limit = limit || 0;

    this.start = start;
    this.stop = stop;

};