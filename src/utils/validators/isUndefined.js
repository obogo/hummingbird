define('isUndefined', function(){
    var isUndefined = function (val) {
        return typeof val === 'undefined';
    };
    return isUndefined;
});