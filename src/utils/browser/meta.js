define('meta', function () {
    return function (name) {
        var meta = document.querySelector("meta[name='" + name + "']");
        if (meta) {
            return meta.getAttribute('content');
        }
    };
});