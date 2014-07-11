/* global dash */
geom.Rect = function (x, y, width, height) {

    this.x = x || 0;
    this.y = y || 0;
    this.width = width || 0;
    this.height = height || 0;

    this.source = function (value) {
        if (value) {
            this.x = value.x || 0;
            this.y = value.y || 0;
            this.width = value.width || 0;
            this.height = value.height || 0;
        }
        return this;
    };

    this.pos = function (point) {
        if (point) {
            this.x = point.x || 0;
            this.y = point.y || 0;
        }
        return {x: this.x, y: this.y};
    };

    this.size = function (point) {
        if (point) {
            this.width = point.x || point.width || 0;
            this.height = point.y || point.height || 0;
        }
        return {x: this.width, y: this.height};
    };

    // GETTERS

    this.top = function () {
        return Number(this.y);
    };

    this.left = function () {
        return Number(this.x);
    };

    this.topLeft = function () {
        return {x: Number(this.x), y: Number(this.y)};
    };

    this.bottom = function () {
        return Number(this.y) + Number(this.height);
    };

    this.right = function () {
        return Number(this.x) + Number(this.width);
    };

    this.bottomRight = function () {
        return {x: Number(this.x) + Number(this.width), y: Number(this.y) + Number(this.height)};
    };

    this.centerX = function () {
        return Number(this.x) + (this.width * 0.5);
    };

    this.centerY = function () {
        return Number(this.y) + (this.height * 0.5);
    };

    // METHODS
    this.clone = function () {
        return (new geom.Rect(Number(this.x), Number(this.y), Number(this.width), Number(this.height)));
    };

    this.contains = function (x, y) {
        x = Number(x);
        y = Number(y);
        return (x >= Number(this.x)) &&
            (x < Number(this.x) + Number(this.width)) &&
            (y >= Number(this.y)) &&
            (y < Number(this.y) + Number(this.height));
    };

    this.containsPoint = function (point) {
        return Number(point.x) >= Number(this.x) &&
            Number(point.x) < (Number(this.x) + Number(this.width)) &&
            Number(point.y) >= Number(this.y) &&
            Number(point.y) < (Number(this.y) + Number(this.height));
    };

    this.containsRect = function (rect) {
        var rRect = rect.source();
        var r1 = Number(rRect.x) + Number(rRect.width);
        var b1 = Number(rRect.y) + Number(rRect.height);
        var r2 = Number(this.x) + Number(this.width);
        var b2 = Number(this.y) + Number(this.height);
        return Number(rRect.x) >= Number(this.x) &&
            Number(rRect.x) < r2 && Number(rRect.y) >= Number(this.y) && Number(rRect.y) < b2 && r1 > Number(this.x) && r1 <= r2 && b1 > Number(this.y) && b1 <= b2;
    };

    this.copyFrom = function (sourceRect) {
        this.x = Number(sourceRect.x || 0);
        this.y = Number(sourceRect.y || 0);
        this.width = Number(sourceRect.width || 0);
        this.height = Number(sourceRect.height || 0);
    };

    this.equals = function (toCompare) {
        return Number(toCompare.x) === Number(this.x) &&
            Number(toCompare.y) === Number(this.y) &&
            Number(toCompare.width) === Number(this.width) &&
            Number(toCompare.height) === Number(this.height);
    };

    this.inflate = function (dx, dy) {
        dx = Number(dx);
        dy = Number(dy);
        this.x = (Number(this.x) - dx);
        this.width = (Number(this.width) + (2 * dx));
        this.y = (Number(this.y) - dy);
        this.height = (Number(this.height) + (2 * dy));
    };

    this.inflatePoint = function (point) {
        this.x = Number(this.x) - Number(point.x);
        this.width = Number(this.width) + (2 * point.x);
        this.y = Number(this.y) - Number(point.y);
        this.height = Number(this.height) + (2 * point.y);
    };

    this.intersection = function (toIntersect) {
        if (this.isEmpty() || toIntersect.isEmpty()) {
            return new geom.Rect();
        }
        var resultX = Math.max(Number(this.x), Number(toIntersect.x));
        var resultY = Math.max(Number(this.y), Number(toIntersect.y));
        var resultWidth = Math.min(Number(this.x) + Number(this.width), Number(toIntersect.x) + Number(toIntersect.width)) - resultX;
        var resultHeight = Math.min(Number(this.y) + Number(this.height), Number(toIntersect.y) + Number(toIntersect.height)) - resultY;
        if (resultWidth <= 0 || resultHeight <= 0) {
            return new geom.Rect();
        }
        return new geom.Rect(resultX, resultY, resultWidth, resultHeight);
    };

    this.intersects = function (toIntersect) {
        if (this.isEmpty() || toIntersect.isEmpty()) {
            return false;
        }
        var thisX = Number(this.x);
        var thisY = Number(this.y);
        var thisW = Number(this.width);
        var thisH = Number(this.height);
        var intX = Number(toIntersect.x);
        var intY = Number(toIntersect.y);
        var intW = Number(toIntersect.width);
        var intH = Number(toIntersect.height);
        var resultX = Math.max(thisX, intX);
        var resultY = Math.max(thisY, intY);
        var resultWidth = (Math.min((thisX + thisW), (intX + intW)) - resultX);
        var resultHeight = (Math.min((thisY + thisH), (intY + intH)) - resultY);
        if (resultWidth <= 0 || resultHeight <= 0) {
            return (false);
        }
        return (true);
    };

    this.isEmpty = function () {
        return Number(this.width) <= 0 || Number(this.height) <= 0;
    };

    this.offset = function (dx, dy) {
        this.x = Number(this.x) + Number(dx);
        this.y = Number(this.y) + Number(dy);
    };

    this.offsetPoint = function (point) {
        this.x = Number(this.x) + Number(point.x);
        this.y = Number(this.y) + Number(point.y);
    };

    this.setEmpty = function () {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
    };

    this.toString = function () {
        return "(x=" + this.x + ", y=" + this.y + ", w=" + this.width + ", h=" + this.height + ")";
    };

    this.union = function (toUnion) {
        var r, rect2;
        if (this.isEmpty()) {
            return (toUnion.clone());
        }
        if (toUnion.isEmpty()) {
            return (this.clone());
        }
        r = {x: 0, y: 0, width: 0, height: 0};
        rect2 = toUnion.source();
        r.x = Math.min(Number(this.x), Number(rect2.x));
        r.y = Math.min(Number(this.y), Number(rect2.y));
        r.width = (Math.max((Number(this.x) + Number(this.width)), (Number(rect2.x) + Number(rect2.width))) - r.x);
        r.height = (Math.max((Number(this.y) + Number(this.height)), (Number(rect2.y) + Number(rect2.height))) - r.y);

        return new geom.Rect(r.x, r.y, r.width, r.height);
    };
};
