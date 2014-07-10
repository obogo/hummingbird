Array.prototype.isArray = true;

var isArray = function isArray(val) {
    return val ? !!val.isArray : false;
};