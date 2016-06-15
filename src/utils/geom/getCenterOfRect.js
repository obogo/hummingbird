define('getCenterOfRect', [], function () {
    return function (rect) {
        return {
            x: rect.x + rect.width * 0.5,
            y: rect.y + rect.height * 0.5
        };
    };
});