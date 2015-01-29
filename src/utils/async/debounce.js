define('debounce', function (debounce) {
    var debounce = function (func, wait, scope) {
        var timeout;
        return function () {
            var context = scope || this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                timeout = null;
                func.apply(context, args);
            }, wait);
        };
    };
    return debounce;
});