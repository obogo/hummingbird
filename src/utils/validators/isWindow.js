define('isWindow', function () {
    var isWindow = function (obj) {
        return obj && obj.document && obj.location && obj.alert && obj.setInterval;
    };
    return isWindow;
});