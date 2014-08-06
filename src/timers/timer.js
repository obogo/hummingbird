/* global timers */
timers.Timer = function(callback, frequency) {

    var scope = this,
        startTime,
        totalTime = 0,
        elapsedTime = 0,
        timer;


    scope.isRunning = false;

    function start() {
        if(!scope.isRunning) {
            scope.isRunning = true;
            startTime = Date.now();
            timer = setInterval(function(){
                elapsedTime = Date.now() - startTime;
                callback(totalTime + elapsedTime);
            }, frequency || 1000);

            callback(totalTime);
        }
    }

    function stop() {
        if(scope.isRunning) {
            scope.isRunning = false;
            clearInterval(timer);
            elapsedTime = Date.now() - startTime;
            totalTime += elapsedTime;
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
