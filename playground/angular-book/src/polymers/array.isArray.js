Array.prototype.isArray = true;

Object.defineProperty(Array.prototype, "isArray", {
    enumerable: false,
    writable: true
});
