define('getTimezoneDate', function() {
    return function (timezoneOffset) {
        if (isNaN(timezoneOffset)) {
            return '';
        }
        var myTz = new Date().getTimezoneOffset();
        return new Date(Date.now() - ((timezoneOffset - myTz) * 60 * 1000));
    };
});