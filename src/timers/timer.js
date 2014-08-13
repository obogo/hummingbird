/* global patterns, timers, async */
timers.Timer = function (options) {

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
        patterns.StateMachine.create({

            target: scope,

            initial: 'ready',

            error: onError,

            events: [
//                { name: 'startup', from: 'none', to: 'ready' },
                { name: 'start', from: 'ready', to: 'running' },
                { name: 'start', from: 'stop', to: 'running' },
                { name: 'stop',  from: 'running', to: 'stop' },
                { name: 'reset', from: 'stop', to: 'ready' }
            ],

            callbacks: {
                onafterstart: onStart,
                onafterstop: onStop,
                onafterreset: onReset
            }

        });
    }

    function setupDispatcher() {
        async.dispatcher(scope);
    }

    function onStart() {
        startTime = Date.now();

        timer = setInterval(function () {
            elapsedTime = getTime();
            scope.dispatch(timers.Timer.events.CHANGE, getTotalTime());
        }, options.frequency || 1000);

        scope.dispatch(timers.Timer.events.START, totalTime);
    }


    function onStop() {
        clearInterval(timer);

        elapsedTime = getTime();
        totalTime += elapsedTime;

        scope.dispatch(timers.Timer.events.STOP, totalTime);
    }

    function onReset() {
        totalTime = 0;
        scope.dispatch(timers.Timer.events.RESET, totalTime);
    }

    function onError(eventName, from, to, args, errorCode, errorMessage) {
        scope.dispatch(timers.Timer.events.ERROR, {
            name: eventName,
            from: from,
            to: to,
            args: args,
            errorCode: errorCode,
            errorMessage: errorMessage
        });
    }

    function getTime() {
        if(scope.current === 'ready') {
            return 0;
        }
        return Date.now() - startTime;
    }

    function getTotalTime() {
        var elapsedTime = getTime();
        return totalTime + elapsedTime;
    }

    scope.getTime = getTime;
    scope.getTotalTime = getTotalTime;

    init();
};

timers.Timer.events = {
    START: 'start',
    STOP: 'stop',
    RESET: 'reset',
    CHANGE: 'change',
    ERROR: 'error'
};
