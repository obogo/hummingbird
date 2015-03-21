define('getAngle', function() {
    return function getAngle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);// in radians
    };
});