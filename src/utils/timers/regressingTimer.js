// ease out the callbacks over time.
define('regressionTimer', function() {
    return function regressionTimer(maxInterval, steps, onInterval, onComplete) {
        var timer, step = 0;
        function intervalCheck() {
            clearTimeout(timer);
            var percent = step/steps;
            var value = percent*(2-percent);
            var wait = Math.round(value * maxInterval);
            (onInterval && onInterval(step, steps));
            if (step < steps) {
                step += 1;
                // console.log(percent, value, wait);
                timer = setTimeout(intervalCheck, wait);
            } else {
                (onComplete && onComplete(step, steps));
            }
        }
        intervalCheck();
        return function stop() {
            clearInterval(timer);
        };
    };
});