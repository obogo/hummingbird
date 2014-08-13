/* global async, timers */
timers.Stopwatch = function (options) {

    var scope = this,
        timer,
        _currentTime = 0,
        currentTime = 0,
        countdownTime = 0,
        startTime = options.startTime || 0,
        endTime = options.endTime || 0,
        tick = options.tick || 1000,
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
        scope.getState = getState;
    }

    function setupListeners() {
        timer.on('start', onStart);
        timer.on('change', onChange);
        timer.on('stop', onStop);
        timer.on('reset', onReset);
    }

    function getTime() {
        var time = Math.floor(currentTime / tick) * tick;
        return time + startTime;
    }

    function getCountdown() {
        return countdownTime;
    }

    function getTimeRemaining() {
        var time = getTime();

        if (endTime) {
            return endTime - time;
        }

        return 0;
    }

    function roundTime(time) {
        return Math.floor(time / tick) * tick;
    }

    function getState() {
        return timer.current;
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
        _currentTime = currentTime;
        updateTime(time);
        if (_currentTime !== currentTime) {
            _currentTime = currentTime;
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

