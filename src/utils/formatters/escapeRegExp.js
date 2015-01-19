define('escapeRegExp', function () {
    return function (str) {
        str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
    };
});