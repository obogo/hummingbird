internal('getDistanceToRect', [], function() {
    return function(rect, pt) {
        var cx = Math.max(Math.min(pt.x, rect.x+rect.width ), rect.x);
        var cy = Math.max(Math.min(pt.y, rect.y+rect.height), rect.y);
        return Math.sqrt( (pt.x-cx)*(pt.x-cx) + (pt.y-cy)*(pt.y-cy) );
    }
});