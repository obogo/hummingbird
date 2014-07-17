validators.isNumeric = function (val) {
    return !isNaN(parseFloat(val)) && isFinite(val);
};