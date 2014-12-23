define('isFile', ['toString'], function (toString) {
    var isFile = function (obj) {
        return toString.call(obj) === '[object File]';
    };
    return isFile;
});
