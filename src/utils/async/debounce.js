define('debounce', function () {
    var debounce = function (func, wait, scope) {
        var timeout;
        return function () {
            var context = scope || this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                timeout = null;
                func.apply(context, args);
            }, wait);
            return function() {
                clearTimeout(timeout);
                timeout = null;
            };
        };
    };
    return debounce;
});