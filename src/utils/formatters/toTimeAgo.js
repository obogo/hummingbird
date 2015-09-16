define('toTimeAgo', function () {

    var defaultStrings = {
        y: 'year',
        ys: 'years',
        m: 'month',
        ms: 'months',
        d: 'day',
        ds: 'days',
        h: 'hour',
        hs: 'hours',
        i: 'minute',
        is: 'minutes',
        s: 'second',
        ss: 'seconds',
        now: 'just now',
        ago: 'ago'
    };

    function timeAgo(date, strings) {
        strings = strings || defaultStrings;
        date = new Date(date);
        var ago = ' ago';
        var returnVal = timeAgoIntv(date);
        var interval = returnVal.interval;
        var prop = returnVal.ago;
        if (interval !== 1) {
            prop += 's';
        }
        if (!strings.hasOwnProperty(prop)) {
            prop = 'now';
        }
        return interval + ' ' + strings[prop] + '' + ago;
    }

    var timeAgoIntv = function (date) {

        var ago = ' ago';
        var interval, seconds;

        seconds = Math.floor((new Date() - date) / 1000);

        interval = Math.floor(seconds / 31536000);
        if (interval >= 1) {
            return {interval: interval, ago: 'y'};
        }

        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) {
            return {interval: interval, ago: 'm'};
        }

        interval = Math.floor(seconds / 86400);
        if (interval >= 1) {
            return {interval: interval, ago: 'd'};
        }

        interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
            return {interval: interval, ago: 'h'};
        }

        interval = Math.floor(seconds / 60);
        if (interval >= 1) {
            return {interval: interval, ago: 'i'};
        }

        interval = seconds < 0 ? 0 : Math.floor(seconds);

        if (interval <= 10) {
            return {interval: interval, ago: 'now'};
        }

        return {interval: interval, ago: 's'};

    };

    return timeAgo;

});
