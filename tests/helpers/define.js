define('define', function () {
    return function(name) {
        define.apply(this, arguments);
        resolve(name, cache[name]);
    };
});