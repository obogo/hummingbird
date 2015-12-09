define('toTime', ['lpad'], function (lpad) {
    return function(seconds, decimals) {
        decimals = decimals || 0;
        var result = {seconds:0, minutes:0, hours:0};
        var str = '';
        var s = Math.floor(seconds);
        var floatVal = decimals && s !== seconds ? seconds.toFixed(decimals) : '';
        result.seconds = s % 60;
        if (s >= 60) {
            result.minutes = Math.floor(s/60);
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
        str += lpad(result.seconds.toString(), '0', 2) + floatVal.substr(1, floatVal.length - 1);
        return str;
    };

});
