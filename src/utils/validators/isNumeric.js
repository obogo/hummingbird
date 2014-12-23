define('isNumeric', function () {
    var isNumeric = function (val) {
        return !isNaN(parseFloat(val)) && isFinite(val);
    };
    return isNumeric;
});