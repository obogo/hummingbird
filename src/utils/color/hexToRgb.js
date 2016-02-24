define('hexToRgb', function() {
    var rx = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
    return function(hex) {
        var result = rx.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };
});