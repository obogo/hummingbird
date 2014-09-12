utils.validators.has = function (obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
};