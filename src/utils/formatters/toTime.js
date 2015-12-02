define('toTime', ['lpad'], function (lpad) {
    return function(seconds) {
        var result = {seconds:0, minutes:0, hours:0};
        var str = '';
        result.seconds = seconds % 60;
        if (seconds >= 60) {
            result.minutes = Math.floor(seconds/60);
            result.hours = Math.floor(result.minutes/60);
            if (result.hours) {
                str += result.hours;
                str += lpad(result.minutes.toString(), '0', 2) + ':';
            } else if (result.minutes) {
                str += result.minutes + ':';
            }
        } else {
            str = '0:';
        }
        str += lpad(result.seconds.toString(), '0', 2);
        return str;
    };

});
