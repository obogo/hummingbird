define('define', function () {
    var cache = {};
    exports.define = function(name) {
        define.apply(this, arguments);
        resolve(name, cache[name]);
    };
});