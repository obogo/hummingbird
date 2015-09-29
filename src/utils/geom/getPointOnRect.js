define('getPointOnRect', ['getCenterOfRect', 'getPointOnCircle'], function(getCenterOfRect, getPointOnCircle) {
    return function (rect, angle) {
        var radius = Math.min(rect.width, rect.height) * 0.5;
        var c = getCenterOfRect(rect);
        var pt = getPointOnCircle(c.x, c.y, radius, angle);
        var left = Math.abs(rect.x - pt.x);
        var top = Math.abs(rect.y - pt.y);
        var right = Math.abs(rect.x + rect.width - pt.x);
        var bottom = Math.abs(rect.y + rect.height - pt.y);
        var min = Math.min(left, top, right, bottom);
        if (min === left) {
            pt.x = rect.x;
        } else if (min === top) {
            pt.y = rect.y;
        } else if (min === right) {
            pt.x = rect.x + rect.width;
        } else if (min === bottom) {
            pt.y = rect.y + rect.height;
        }
        return pt;
    };
});