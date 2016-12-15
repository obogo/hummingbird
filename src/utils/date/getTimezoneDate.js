define('getTimezoneDate', function() {
    return function (timezoneOffset) {
        if (isNaN(timezoneOffset)) {
            throw new Error("Expected " + + " to be a Number instead got type " + typeof timezoneOffset);
        }
        var myTz = new Date().getTimezoneOffset();
        return new Date(Date.now() - ((timezoneOffset - myTz) * 60 * 1000));
    };
});