define('delay', function () {
    return function delay(fn, time) {
        return function() { setTimeout(fn, time || 0); };
    };
});