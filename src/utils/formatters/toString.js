define('toString', function () {
    var toString = function () {
        var value = [];
        forEach(this, function (e) {
            value.push('' + e);
        });
        return '[' + value.join(', ') + ']';
    };

    return toString;
});
