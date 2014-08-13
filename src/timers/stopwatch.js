/* global async, timers */
timers.Stopwatch = function (options) {

    var scope = this,
        timer,
        currentTime = 0,
        countdownTime = 0,
        currentSecs = 0,
        countdown = !!options.countdown,
        startTime = options.startTime || 0,
        endTime = options.endTime || 0,
        frequency = 10;

    function init() {
        scope.options = options;

        countdownTime = endTime;

        setupTimer();
        setupDispatcher();
        setupAPI();
        setupListeners();
    }

    function setupTimer() {
        timer = new timers.Timer({ frequency: frequency });
    }

    function setupDispatcher() {
        async.dispatcher(scope);
    }

    function setupAPI() {
        scope.start = start;
        scope.stop = stop;
        scope.reset = reset;

        scope.getTime = getTime;
        scope.getCountdown = getCountdown;
        scope.getTimeRemaining = getTimeRemaining;
//        scope.getSeconds = getSeconds;
        scope.getState = getState;
//        scope.getClock = getClock;
    }

    function setupListeners() {
        timer.on('start', onStart);
        timer.on('change', onChange);
        timer.on('stop', onStop);
        timer.on('reset', onReset);
    }

    function getTime() {
//        var time = currentTime;
//        if (countdown) {
//            time = Math.ceil(currentTime * 0.001) * 1000;
//            return time;
//        }
        var time = Math.floor(currentTime * 0.001) * 1000;
        return time + startTime;
    }

    function getCountdown() {
        return countdownTime;
    }

    function getTimeRemaining() {
//        return Math.ceil(currentTime * 0.001) * 1000;
        var time = getTime();

        if (endTime) {
            return endTime - time;
        }

        return 0;
    }

    function getSeconds() {
        return Math.floor(getTime() * 0.001);
    }

//    function getClock() {
//        var val, d, secs, m, s, min, sec, time;
//
//        time = getTime();
//
//        secs = time * 0.001;
//        d = Math.round(secs);
//
//        m = Math.floor(d % 3600 / 60);
//        s = Math.floor(d % 3600 % 60);
//        min = formatNumber(m);
//        sec = formatNumber(s);
//
//        val = min + ':' + sec;
//
//        return val;
//    }

    function getState() {
        return timer.current;
    }

//    function formatNumber(num) {
//        var val;
//        num = Number(num);
//        if (num > 0) {
//            if (num >= 10) {
//                val = num;
//            } else {
//                val = '0' + num;
//            }
//        } else {
//            val = '00';
//        }
//        return val;
//    }

    function roundTime(ms) {
        return Math.floor(ms * 0.001) * 1000;
    }

    function updateTime(time) {
        currentTime = roundTime(time);
        if (endTime) {
            countdownTime = endTime - currentTime;
        }
    }

    function start() {
        timer.start();
    }

    function stop() {
        timer.stop();
    }

    function reset() {
        timer.reset();
    }

    function onStart(evt, time) {
        updateTime(time);
        scope.dispatch(timers.Stopwatch.events.START);
    }

    function onChange(evt, time) {
        updateTime(time);
        if (currentSecs !== getSeconds()) {
            currentSecs = getSeconds();
            scope.dispatch(timers.Stopwatch.events.CHANGE);
            if (endTime) {
                if (getTime() >= endTime) {
                    scope.dispatch(timers.Stopwatch.events.DONE);
                    timer.stop();
                }
            }
        }
    }

    function onStop(evt, time) {
        updateTime(time);
        scope.dispatch(timers.Stopwatch.events.STOP);
    }

    function onReset(evt, time) {
        updateTime(time);
        scope.dispatch(timers.Stopwatch.events.RESET);
    }

    init();
};

timers.Stopwatch.events = {
    START: 'start',
    STOP: 'stop',
    RESET: 'reset',
    CHANGE: 'change',
    DONE: 'done',
    ERROR: 'error'
};

