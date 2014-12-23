define('isArray', function(){

    Array.prototype.isArray = true;
    Object.defineProperty(Array.prototype, "isArray", {
        enumerable: false,
        writable: true
    });

    var isArray = function (val) {
        return val ? !!val.isArray : false;
    };

    return isArray;

});

