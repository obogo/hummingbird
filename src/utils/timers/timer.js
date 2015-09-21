/* global patterns, timers, async */
define('timer', ['dispatcher', 'stateMachine'], function (dispatcher, stateMachine) {

    var Timer = function (options) {

        options = options || {};

        var scope = this,
            startTime = 0,
            totalTime = 0,
            elapsedTime = 0,
            timer;

        function init() {
            setupStateMachine();
            setupDispatcher();
        }

        function setupStateMachine() {
            stateMachine({

                target: scope,

                initial: 'ready',

                error: onError,

                events: [
//                { name: 'startup', from: 'none', to: 'ready' },
                    {name: 'start', from: 'ready', to: 'running'},
                    {name: 'start', from: 'stop', to: 'running'},
                    {name: 'stop', from: 'running', to: 'stop'},
                    {name: 'reset', from: 'stop', to: 'ready'}
                ],

                callbacks: {
                    onafterstart: onStart,
                    onafterstop: onStop,
                    onafterreset: onReset
                }

            });
        }

        function setupDispatcher() {
            dispatcher(scope);
        }

        function onStart() {
            startTime = Date.now();

            timer = setInterval(function () {
                elapsedTime = getTime();
                var totalTime = getTotalTime();
                scope.dispatch(Timer.events.CHANGE, getTotalTime());
            }, options.frequency || 1000);

            scope.dispatch(Timer.events.START, totalTime);
        }


        function onStop() {
            clearInterval(timer);

            elapsedTime = getTime();
            totalTime += elapsedTime;

            scope.dispatch(Timer.events.STOP, totalTime);
        }

        function onReset() {
            totalTime = 0;
            scope.dispatch(Timer.events.RESET, totalTime);
        }

        function onError(eventName, from, to, args, errorCode, errorMessage) {
            scope.dispatch(Timer.events.ERROR, {
                name: eventName,
                from: from,
                to: to,
                args: args,
                errorCode: errorCode,
                errorMessage: errorMessage
            });
        }

        function getTime() {
            if (scope.current === 'ready') {
                return 0;
            }
            return Date.now() - startTime;
        }

        function getTotalTime() {
            if (scope.current === 'running') {
                var elapsedTime = getTime();
                return totalTime + elapsedTime;
            }
            return totalTime;
        }

        scope.getTime = getTime;
        scope.getTotalTime = getTotalTime;

        init();
    };

    Timer.events = {
        START: 'start',
        STOP: 'stop',
        RESET: 'reset',
        CHANGE: 'change',
        ERROR: 'error'
    };

    return function (options) {
        return new Timer(options);
    };

});
