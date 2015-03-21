define('degreesToRadians', function() {
    return function degreesToRadians(deg) {
        return deg * (Math.PI/180);
    };
});