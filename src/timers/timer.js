/* global timers */
timers.Timer = function(callback, frequency) {

    var scope = this,
        startTime,
        totalTime = 0,
        ellapsedTime = 0,
        timer;

    scope.isRunning = false;

    function start() {
        if(!scope.isRunning) {
            scope.isRunning = true;
            startTime = Date.now();
            timer = setInterval(function(){
                ellapsedTime = Date.now() - startTime;
                callback(totalTime + ellapsedTime);
            }, frequency || 1000);

            callback(totalTime);
        }
    }

    function stop() {
        if(scope.isRunning) {
            scope.isRunning = false;
            clearInterval(timer);
            ellapsedTime = Date.now() - startTime;
            totalTime += ellapsedTime;
            callback(totalTime);
        }
    }

    function reset() {
        totalTime = 0;
    }

    this.start = start;
    this.stop = stop;
    this.reset = reset;

};
