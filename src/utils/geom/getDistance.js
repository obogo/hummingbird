define('getDistance', function() {
    return function getDistance(x1, y1, x2, y2) {
        return Math.sqrt( (x2-=x1)*x2 + (y2-=y1)*y2 );
    };
});