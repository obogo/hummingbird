define('svgToCss', ['base64Encode'], function(base64Encode) {
    return function (str) {
        return 'data:image/svg+xml;base64,' + base64Encode(str);
    };
});