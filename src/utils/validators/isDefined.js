define('isDefined', function () {
    var isDefined = function (val) {
        return typeof val !== 'undefined';
    };
    return isDefined;
});