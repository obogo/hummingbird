utils.validators.isFile = function (obj) {
    return utils.formatters.toString.call(obj) === '[object File]';
};