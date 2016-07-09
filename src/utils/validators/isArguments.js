define('isArguments', function () {
    var toString = function () {
        var value = [];
        for (var e in this) {
            if (this.hasOwnProperty(e)) {
                value.push('' + e);
            }
        }
        return '[' + value.join(', ') + ']';
    };

    var isArguments = function (value) {
        var str = String(value);
        var isArguments = str === '[object Arguments]';
        if (!isArguments) {
            isArguments = str !== '[object Array]' &&
                value !== null &&
                typeof value === 'object' &&
                typeof value.length === 'number' &&
                value.length >= 0 &&
                (!value.callee || toString.call(value.callee) === '[object Function]');
        }
        return isArguments;
    };
    return isArguments;
});
