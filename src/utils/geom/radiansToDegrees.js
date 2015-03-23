define('radiansToDegrees', function() {
    return function radiansToDegrees(radians) {
        return radians * (180/Math.PI);
    };
});