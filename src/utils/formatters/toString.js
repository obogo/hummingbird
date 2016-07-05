define('toString', function () {
    var toString = function () {
        var value = [];
        for (var e in this) {
            if (this.hasOwnProperty(e)) {
                value.push('' + e);
            }
        }
        return '[' + value.join(', ') + ']';
    };

    return toString;
});
