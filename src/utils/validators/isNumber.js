define('isNumber', function () {
    var isNumber = function (val) {
        return typeof val === 'number';
    };

    return isNumber;
});