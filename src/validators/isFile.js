validators.isFile = function (obj) {
    return toString.call(obj) === '[object File]';
}