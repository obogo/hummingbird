define('getPointOnCircle', function() {
    return function getPointOnCircle(cx, cy, r, a) {
        return {x: cx + r * Math.cos(a),  y: cy + r * Math.sin(a)};
    };
});