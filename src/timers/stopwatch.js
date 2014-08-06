/* global timers */
timers.StopWatch = function(callback, totalTime, countdown, frequency) {

    var scope = this;
    var done = false;

    scope.totalTime = totalTime || 0;
    scope.countdown = false;
    scope.isRunning = false;

    var timer = new timers.Timer(function(time) {
        var milliseconds, seconds;

        if(!done) {

            if(time >= scope.totalTime) {
                done = true;
                stop();
                reset();
            }

            if(scope.countdown) {
                milliseconds = scope.totalTime - time;
                seconds = Math.ceil((milliseconds) * 0.001);
            } else {
                milliseconds = time;
                seconds = Math.floor((milliseconds) * 0.001);
            }

            milliseconds = Math.min(Math.max(0, milliseconds), scope.totalTime);
            seconds = Math.max(0, seconds);

            if(milliseconds < 0) {
                seconds = 0;
                milliseconds = 0;
            }

            updateDisplay(seconds, milliseconds, done);
        }

    }, frequency || 100);

    function secondsToMS(d) {
        var val;
        d = Number(d);
        var m = Math.floor(d % 3600 / 60);
        var s = Math.floor(d % 3600 % 60);
        // var min = format(m);
        var min = m;
        var sec = padNum(s);
        val = min + ':' + sec;
        return val;
    }

    function padNum(num) {
        var val;
        num = Number(num);
        if (num > 0) {
            if (num >= 10) {
                val = num;
            } else {
                val = '0' + num;
            }
        } else {
            val = '00';
        }
        return val;
    }

    function updateDisplay(seconds, milliseconds, done) {
        var formattedTime = secondsToMS(seconds || 0);
        callback({
            seconds: seconds,
            time: milliseconds,
            value: formattedTime,
            done: done
        });
    }

    function start() {
        if(!scope.isRunning) {
            scope.done = false;
            scope.isRunning = true;
            timer.start();
        }
    }

    function stop() {
        if(scope.isRunning) {
            scope.isRunning = false;
            timer.stop();
        }
    }

    function reset() {
        timer.reset();
    }

    scope.start = start;
    scope.stop = stop;
    scope.reset = reset;
};
