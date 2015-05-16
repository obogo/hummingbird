define('functionArgs', function() {
    var rx1 = /\(.*?\)/;
    var rx2 = /([\$\w])+/gm;
    return function (fn) {
        var str = (fn || '') + '';
        return str.match(rx1)[0].match(rx2) || [];
    };
});