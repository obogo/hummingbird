define('hexToRgb', function() {
    var rx = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
    function RGBA(r, g, b, a) {
        this.r = r && parseInt(r, 16) || 0;
        this.g = g && parseInt(g, 16) || 0;
        this.b = b && parseInt(b, 16) || 0;
        this.a = a !== undefined ? parseFloat(a) : undefined;
        this.toString = function() {
            return 'rgb' + (this.a !== undefined ? 'a' : '') + '(' + this.r + ',' + this.g + ',' + this.b + (this.a !== undefined ? ',' + this.a : '') + ')';
        };
    }

    return function(hex) {
        var result = rx.exec(hex);
        return result ? new RGBA(result[1], result[2], result[3]) : null;
    };
});