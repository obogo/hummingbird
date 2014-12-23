define('isInt', function () {

    var isInt = function (val) {
        return String(val).search(/^\s*(\-)?\d+\s*$/) !== -1;
    };

    return isInt;

});

