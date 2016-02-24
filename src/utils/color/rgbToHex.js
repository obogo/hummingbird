define('rgbToHex', function () {
    return function (red, green, blue) {
        red = Math.max(0, Math.min(~~red, 255));
        green = Math.max(0, Math.min(~~green, 255));
        blue = Math.max(0, Math.min(~~blue, 255));

        // Credit: Asen  http://jsbin.com/UPUmaGOc/2/edit?js,console
        return '#' + ('00000' + (red << 16 | green << 8 | blue).toString(16)).slice(-6);
    };
});