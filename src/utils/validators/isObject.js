define('isObject', function(){
    var isObject = function (val) {
        return val !== null && typeof val === 'object';
    };
    return isObject;
});