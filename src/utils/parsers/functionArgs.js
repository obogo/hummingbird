define('functionArgs', function() {
    return function (fn) {
        var str = (fn || '') + '';
        return str.match(/\(.*\)/)[0].match(/([\$\w])+/gm);
    };
});