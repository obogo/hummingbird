validators.isNumber = function (val) {
    return !isNaN(parseFloat(val)) && isFinite(val);
};