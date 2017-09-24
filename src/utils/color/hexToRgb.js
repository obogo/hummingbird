define('hexToRgb', function() {
    var rx = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
    function RGBA(r, g, b, a) {
        this.r = r && parseInt(r, 16) || 0;
        this.g = g && parseInt(g, 16) || 0;
        this.b = b && parseInt(b, 16) || 0;
        this.a = a !== undefined ? parseFloat(a) : undefined;
        this.toString = function() {
            var hasAlpha = !isNaN(this.a);
            return 'rgb' + (hasAlpha ? 'a' : '') + '(' + this.r + ',' + this.g + ',' + this.b + (hasAlpha ? ',' + this.a : '') + ')';
        };
    }

    return function(hex, alpha) {
        var result = rx.exec(hex);
        return result ? new RGBA(result[1], result[2], result[3], alpha) : hex;
    };
});