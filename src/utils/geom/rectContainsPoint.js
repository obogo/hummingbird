define('rectContainsPoint', [], function() {
    return function rectangleContainsPoint(rect, point) {
    	if (rect.width <= 0 || rect.height <= 0) {
    		return false;
    	}

    	return (point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height);
    };
});