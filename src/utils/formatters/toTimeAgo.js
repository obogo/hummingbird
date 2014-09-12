utils.formatters.toTimeAgo = function (date) {

    var ago = ' ago';
    var interval, seconds;

    seconds = Math.floor((new Date() - date) / 1000);

    interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        return { interval: interval, ago: 'y' };
    }

    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return { interval: interval, ago: 'mo' };
    }

    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return { interval: interval, ago: 'd' };
    }

    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return { interval: interval, ago: 'h' };
    }

    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return { interval: interval, ago: 'm' };
    }

    interval = seconds < 0 ? 0 : Math.floor(seconds);

    if (interval <= 10) {
        return { interval: interval, ago: '' };
    }

    return { interval: interval, ago: 's' };

};