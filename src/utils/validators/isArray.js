define('isArray', function(){

    Array.prototype.__isArray = true;
    Object.defineProperty(Array.prototype, "__isArray", {
        enumerable: false,
        writable: true
    });

    var isArray = function (val) {
        return val ? !!val.__isArray : false;
    };

    return isArray;

});

