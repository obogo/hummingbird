/* global async */
define('stopwatch', ['timer', 'dispatcher'], function (Timer, dispatcher) {

    var Stopwatch = function (options) {

        options = options || {};

        var scope = this,
            timer,
            done = false,
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

            setTimeout(function () {
                scope.dispatch(Stopwatch.events.READY);
            });
        }

        function setupTimer() {
            timer = new Timer({frequency: frequency});
        }

        function setupDispatcher() {
            dispatcher(scope);
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
            if (getState() === 'ready') {
                timer.start();
            }
        }

        function stop() {
            timer.stop();
        }

        function reset() {
            timer.reset();
        }

        function onStart(evt, time) {
            updateTime(time);
            scope.dispatch(Stopwatch.events.START);
        }

        function onChange(evt, time) {
            _currentTime = currentTime;
            updateTime(time);
            if (_currentTime !== currentTime) {
                _currentTime = currentTime;
                scope.dispatch(Stopwatch.events.CHANGE);
                if (endTime) {
                    if (getTime() >= endTime) {
                        onDone(evt, time);
                    }
                }
            }
        }

        function onStop(evt, time) {
            updateTime(time);
            scope.dispatch(Stopwatch.events.STOP);
        }

        function onReset(evt, time) {
            updateTime(time);
            scope.dispatch(Stopwatch.events.RESET);
        }

        function onDone(evt, time) {
            done = true;
            scope.dispatch(Stopwatch.events.DONE);
            timer.stop();
        }

        init();
    };

    Stopwatch.events = {
        READY: 'ready',
        START: 'start',
        STOP: 'stop',
        RESET: 'reset',
        CHANGE: 'change',
        DONE: 'done',
        ERROR: 'error'
    };

    return function (options) {
        return new Stopwatch(options);
    };

});

