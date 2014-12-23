define('isArguments', function () {
    var isArguments = function (value) {
        return value && typeof value == 'object' && typeof value.length == 'number' &&
            toString.call(value) == argsClass || false;
    };
    return isArguments;
});
