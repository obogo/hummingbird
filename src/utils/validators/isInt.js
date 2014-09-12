utils.validators.isInt = function (val) {
    return String(val).search(/^\s*(\-)?\d+\s*$/) !== -1;
};
