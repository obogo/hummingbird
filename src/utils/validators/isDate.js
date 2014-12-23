define('isDate', function () {
    var isDate = function (val) {
        return val instanceof Date;
    };
    return isDate;
});
