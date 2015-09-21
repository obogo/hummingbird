define('keygen', function () {

    var keygen = function (pattern) {
        var defaultPattern = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
        return (pattern || defaultPattern).replace(/[x]/ig, function (b) {
            var d = 16 * Math.random() | 0;
            return ('x' == b ? d : d & 3 | 8).toString(16);
        });
    };

    return keygen;

});
