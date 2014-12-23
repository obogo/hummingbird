/* global display */

internal('align', function () {

    var sorting;

    var AdjacentBottomAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var bottomEdge = bounds.bottom();
            var length = targets.length;
            while (length--) {
                targets[length].y(bottomEdge);
            }
        };
    };

    var AdjacentBottomLeftAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var bottomEdge = bounds.bottom();
            var leftEdge = bounds.left();
            var length = targets.length;
            while (length--) {
                var target = targets[length];
                target.x(leftEdge - target.width());
                target.y(bottomEdge);
            }
        };
    };

    var AdjacentBottomRightAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var bottomEdge = bounds.bottom();
            var rightEdge = bounds.right();
            var length = targets.length;
            while (length--) {
                var item = targets[length];
                item.x(rightEdge);
                item.y(bottomEdge);
            }
        };
    };

    var AdjacentHorizontalLeftAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var centerX = bounds.left() + bounds.width() * 0.5;
            var length = targets.length;
            while (length--) {
                targets[length].x(centerX - targets[length].width());
            }
        };
    };

    var AdjacentHorizontalRightAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var centerX = bounds.left() + bounds.width() * 0.5;
            var length = targets.length;
            while (length--) {
                targets[length].x(centerX);
            }
        };
    };

    var AdjacentLeftAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var leftEdge = bounds.left();
            var length = targets.length;
            while (length--) {
                targets[length].x(leftEdge - targets[length].width());
            }
        };
    };

    var AdjacentRightAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var rightEdge = bounds.right();
            var length = targets.length;
            while (length--) {
                targets[length].x(rightEdge);
            }
        };
    };

    var AdjacentTopAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var topEdge = bounds.top();
            var length = targets.length;
            while (length--) {
                targets[length].y(topEdge - targets[length].height());
            }
        };
    };

    var AdjacentTopLeftAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var topEdge = bounds.top();
            var leftEdge = bounds.left();
            var length = targets.length;
            while (length--) {
                var target = targets[length];
                target.x(leftEdge - target.width());
                target.y(topEdge - target.height());
            }
        };
    };

    var AdjacentTopRightAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var topEdge = bounds.top();
            var rightEdge = bounds.right();
            var length = targets.length;
            while (length--) {
                var target = targets[length];
                target.x(rightEdge);
                target.y(topEdge - target.height());
            }
        };
    };

    var AdjacentVerticalBottomAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var centerY = bounds.centerY();
            var length = targets.length;
            while (length--) {
                targets[length].y(centerY);
            }
        };
    };

    var AdjacentVerticalTopAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var centerY = bounds.centerY();
            var length = targets.length;
            while (length--) {
                targets[length].y(centerY - targets[length].height());
            }
        };
    };

    var BottomAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var bottomEdge = bounds.bottom();
            var length = targets.length;
            while (length--) {
                targets[length].val('y', bottomEdge - targets[length].height);
            }
        };
    };

    var BottomLeftAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var bottomEdge = bounds.bottom();
            var leftEdge = bounds.left();
            var length = targets.length;
            while (length--) {
                targets[length].x(leftEdge);
                targets[length].y(bottomEdge - targets[length].height());
            }
        };
    };

    var BottomRightAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var bottomEdge = bounds.bottom();
            var rightEdge = bounds.right();
            var length = targets.length;
            while (length--) {
                var target = targets[length];
                target.x(rightEdge - target.width());
                target.y(bottomEdge - target.height());
            }
        };
    };

    var CenterAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var centerX = bounds.centerX();
            var centerY = bounds.centerY();
            var length = targets.length;
            while (length--) {
                var target = targets[length];
                target.x(centerX - (target.width() * 0.5));
                target.y(centerY - (target.height() * 0.5));
            }
        };
    };

    /**
     * Distribute bottom
     * @constructor
     */
    var DistributeBottomAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            targets = targets.concat();
            targets.sort(sorting.sortRectBottom);

            var length = targets.length;
            var first = bounds.top() + targets[0].bounds.height;
            var spread = ( ( bounds.bottom() - first ) / ( length - 1 ) );
            while (length--) {
                targets[length].val('y', first - targets[length].bounds.height + ( spread * length ));
            }
        };
    };

    /**
     * Distribute horizontal
     * @constructor
     */
    var DistributeHorizontalAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            targets = targets.concat();
            targets = targets.sort(sorting.sortRectCenterX);

            var length = targets.length;
            var first = bounds.left() + (targets[0].bounds.width * 0.5);
            var last = bounds.right() - (targets[targets.length - 1].width * 0.5);
            var spread = ((last - first) / (length - 1));
            while (length--) {
                targets[length].val('x', first - ( targets[length].bounds.width * 0.5 ) + ( spread * length ));
            }
        };
    };

    /**
     * Distribute left
     * @constructor
     */
    var DistributeLeftAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            targets = targets.concat();
            targets = targets.sort(sorting.sortRectLeft);

            var leftEdge = bounds.left();
            var spread = (bounds.width - targets[targets.length - 1].bounds.width) / (targets.length - 1);
            var length = targets.length;
            while (length--) {
                targets[length].val('x', leftEdge + (spread * length));
            }
        };
    };

    /**
     * Distribute right
     * @constructor
     */
    var DistributeRightAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            targets = targets.concat();
            targets.sort(sorting.sortRectRight);

            var leftEdge = bounds.left();
            var first = leftEdge + targets[0].bounds.width;
            var spread = ( ( bounds.right() - first ) / ( targets.length - 1 ) );
            var length = targets.length;
            while (length--) {
                targets[length].val('x', first - targets[length].bounds.width + ( spread * length ));
            }
        };
    };

    /**
     * Distribute top
     * @constructor
     */
    var DistributeTopAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            targets = targets.concat();
            targets = targets.sort(sorting.sortRectTop);

            var length = targets.length;
            var first = bounds.top();
            var spread = ( bounds.bottom() - targets[length - 1].bounds.height - first ) / ( length - 1 );
            while (length--) {
                targets[length].val('y', first + ( spread * length ));
            }

        };
    };

    /**
     * Distribute vertical
     * @constructor
     */
    var DistributeVerticalAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            targets = targets.concat();
            targets = targets.sort(sorting.sortRectCenterY);

            var length = targets.length;
            var first = bounds.top() + ( targets[0].bounds.height * 0.5 );
            var last = bounds.bottom() - ( targets[length - 1].bounds.height * 0.5);
            var spread = ( last - first ) / ( length - 1 );
            while (length--) {
                targets[length].val('y', first - ( targets[length].bounds.height * 0.5 ) + ( spread * length ));
            }
        };
    };

    /**
     * Align horizontal
     * @constructor
     */
    var HorizontalAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var mid = bounds.left() + (bounds.width * 0.5);
            var length = targets.length;
            while (length--) {
                targets[length].val('x', mid - (targets[length].bounds.width * 0.5));
            }
        };
    };

    /**
     * Align left
     * @constructor
     */
    var LeftAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var leftEdge = bounds.left();
            var length = targets.length;
            while (length--) {
                targets[length].val('x', leftEdge);
            }
        };
    };

    /**
     * Match height
     * @constructor
     */
    var MatchHeightAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var endH = bounds.height;
            var length = targets.length;
            while (length--) {
                targets[length].val('height', endH);
            }
        };
    };

    /**
     * Match width and height
     * @constructor
     */
    var MatchSizeAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var endW = bounds.width;
            var endH = bounds.height;
            var length = targets.length;
            while (length--) {
                targets[length].val('width', endW);
                targets[length].val('height', endH);
            }
        };
    };

    /**
     * Match width
     * @constructor
     */
    var MatchWidthAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var endW = bounds.width;
            var length = targets.length;
            while (length--) {
                targets[length].val('width', endW);
            }
        };
    };

    /**
     * Align right
     * @constructor
     */
    var RightAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var rightEdge = bounds.right();
            var length = targets.length;
            while (length--) {
                targets[length].val('x', rightEdge - targets[length].bounds.width);
            }
        };
    };

    var ScaleToFillAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var width = bounds.width();
            var height = bounds.height();
            var ratio = width / height;
            var length = targets.length;
            while (length--) {
                var item = targets[length];
                var itemWHRatio = item.width() / item.height();
                var itemHWRatio = item.height() / item.width();
                if (itemWHRatio > ratio) {
                    item.height(height);
                    item.width(height / itemHWRatio);
                } else if (itemWHRatio < ratio) {
                    item.width(width);
                    item.height(width / itemWHRatio);
                } else {
                    item.width(width);
                    item.height(height);
                }
            }
        };
    };

    var ScaleToFitAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var width = bounds.width();
            var height = bounds.height();
            var ratio = width / height;
            var length = targets.length;
            while (length--) {
                var item = targets[length];
                var itemWHRatio = item.width() / item.height();
                var itemHWRatio = item.height() / item.width();
                if (itemWHRatio > ratio) {
                    item.width(width);
                    item.height(width / itemWHRatio);
                } else if (itemWHRatio < ratio) {
                    item.height(height);
                    item.width(height / itemHWRatio);
                } else {
                    item.width(width);
                    item.height(height);
                }
            }
        };
    };

    /**
     * Space horizontal
     * @constructor
     */
    var SpaceHorizontalAligner = function () {
        this.alignRectangles = function (bounds, targets, spread) {
            targets = targets.concat();
            targets = targets.sort(sorting.sortRectLeft);

            var objsWidth = 0;
            var totalWidth = bounds.width;
            var length = targets.length;
            while (length--) {
                objsWidth += targets[length].bounds.width;
            }
            length = targets.length;
            spread = spread !== undefined ? spread : ( totalWidth - objsWidth ) / ( length - 1 );
            spread = Number(spread);
            var right = bounds.left() + targets[0].bounds.width;
            targets[0].val('x', bounds.left());
            for (var j = 1; j < length; j++) {
                var item = targets[j];
                item.val('x', right + spread);
                right += item.bounds.width + spread;
            }
        };
    };

    var SpaceInsideHorizontalAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            targets = targets.concat();
            targets = targets.sort(sorting.sortRectLeft);

            var objsWidth = 0;
            var totalWidth = bounds.width();
            var length = targets.length;
            while (length--) {
                objsWidth += targets[length].width();
            }

            var spread = ( totalWidth - objsWidth ) / ( length + 1 );
            var right = bounds.left();
            for (var j = 0; j < length; j++) {
                var item = targets[j];
                item.x(right + spread);
                right += item.width() + spread;
            }
        };
    };

    var SpaceInsideVerticalAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            targets = targets.concat();
            targets = targets.sort(sorting.sortRectTop);

            var objsHeight = 0;
            var totalHeight = bounds.height();
            var length = targets.length;
            while (length--) {
                objsHeight += targets[length].height();
            }

            var spread = ( totalHeight - objsHeight ) / ( length + 1 );
            var bottom = bounds.top();
            for (var j = 0; j < length; j++) {
                var target = targets[j];
                target.y(bottom + spread);
                bottom += target.height() + spread;
            }
        };
    };

    /**
     * Space vertical
     * @constructor
     */
    var SpaceVerticalAligner = function () {
        this.alignRectangles = function (bounds, targets, spread) {
            targets = targets.concat();
            targets = targets.sort(sorting.sortRectTop);

            var targetTotalHeight = 0;
            var totalHeight = bounds.height;
            var length = targets.length;
            while (length--) {
                targetTotalHeight += targets[length].bounds.height;
            }
            length = targets.length;
            spread = spread !== undefined ? spread : ( totalHeight - targetTotalHeight ) / ( length - 1 );
            var bottom = bounds.top() + targets[0].bounds.height;
            targets[0].val('y', bounds.top());
            for (var j = 1; j < length; j++) {
                var item = targets[j];
                item.val('y', bottom + spread);
                bottom += item.bounds.height + spread;
            }
        };
    };

    /**
     * Align top
     * @constructor
     */
    var TopAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var topEdge = bounds.top();
            var length = targets.length;
            while (length--) {
                targets[length].val('y', topEdge);
            }
        };
    };

    var TopLeftAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var topEdge = bounds.top();
            var leftEdge = bounds.left();
            var length = targets.length;
            while (length--) {
                targets[length].y(topEdge);
                targets[length].x(leftEdge);
            }
        };
    };

    var TopRightAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var topEdge = bounds.top();
            var rightEdge = bounds.right();
            var length = targets.length;
            while (length--) {
                targets[length].x(rightEdge - targets[length].width());
                targets[length].y(topEdge);
            }
        };
    };

    /**
     * Align vertical
     * @constructor
     */
    var VerticalAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var centerY = bounds.centerY();
            var length = targets.length;
            while (length--) {
                targets[length].val('y', centerY - ( targets[length].bounds.height * 0.5));
            }
        };
    };

    var StackHorizontalAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            targets = targets.concat();
            var before = [];
            var after = [];
            var left = 0;
            var right = 0;
            var item;
            var endX;
            var leftEdge = bounds.left();
            var rightEdge = bounds.right();
            var centerX = bounds.centerX();

            for (var i = 0; i < targets.length; i++) {
                var target = targets[length];
                var targetCenterX = target.centerX();
                if (targetCenterX < centerX) {
                    before.push(targets[length]);
                } else {
                    after.push(targets[length]);
                }
            }
            before.sort(sorting.sortRectAdjacentRight);
            after.sort(sorting.sortRectAdjacentLeft);
            before.reverse();
            var firstTarget;

            if (before.length > 0) {
                firstTarget = before[0];
                endX = leftEdge - firstTarget.width;
                left = leftEdge - firstTarget.width;
                firstTarget.x(endX);
                for (i = 1; i < before.length; i++) {
                    item = before[i];
                    endX = left - item.width;
                    left -= item.width;
                    item.x(endX);
                }
            }

            if (after.length > 0) {
                firstTarget = after[0];
                endX = rightEdge;
                right = rightEdge + firstTarget.width;
                firstTarget.x(endX);
                for (i = 1; i < after.length; i++) {
                    item = after[i];
                    endX = right;
                    right += item.width;
                    item.x(endX);
                }
            }
        };
    };

    var StackVerticalAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            targets = targets.concat();
            var above = [];
            var below = [];
            var centerY = bounds.centerY();
            for (var i = 0; i < targets.length; i++) {
                var target = targets[length];
                var targetCenterY = target.centerY();
                if (targetCenterY < centerY) {
                    above.push(targets[length]);
                } else {
                    below.push(targets[length]);
                }
            }
            above.sort(sorting.sortRectAdjacentTop);
            below.sort(sorting.sortRectAdjacentBottom);
            above.reverse();
            var top = 0;
            var bottom = 0;
            var item;
            var endY;
            for (var j = 0; j < above.length; j++) {
                item = above[j];
                if (j !== 0) {
                    endY = top - item.height();
                    top -= item.height();
                } else {
                    endY = bounds.top() - item.height();
                    top = bounds.top() - item.height();
                }
                item.y(endY);
            }
            for (var k = 0; k < below.length; k++) {
                item = below[k];
                if (k !== 0) {
                    endY = bottom;
                    bottom += item.height();
                } else {
                    endY = bounds.bottom();
                    bottom = bounds.bottom();
                }
                item.y(endY);
            }
        };
    };

    var FlipHorizontalAligner = function () {
        this.alignRectangles = function (bounds, targets) {
            var leftEdge = bounds.left();
            var rightEdge = bounds.right();
            var length = targets.length;
            while (length--) {
                targets[length].val('x', leftEdge + rightEdge - targets[length].bounds.x - targets[length].bounds.width);
            }
        };
    };

    var Align = function () {
        sorting = new dash.display.Sorting();

        this.left = new LeftAligner();
        this.horizontal = new HorizontalAligner();
        this.right = new RightAligner();
        this.top = new TopAligner();
        this.vertical = new VerticalAligner();
        this.bottom = new BottomAligner();
        this.center = new CenterAligner();
        this.topLeft = new TopLeftAligner();
        this.topRight = new TopRightAligner();
        this.bottomLeft = new BottomLeftAligner();
        this.bottomRight = new BottomRightAligner();
        this.adjacentLeft = new AdjacentLeftAligner();
        this.adjacentHorizontalLeft = new AdjacentHorizontalLeftAligner();
        this.adjacentHorizontalRight = new AdjacentHorizontalRightAligner();
        this.adjacentRight = new AdjacentRightAligner();
        this.adjacentTop = new AdjacentTopAligner();
        this.adjacentVerticalTop = new AdjacentVerticalTopAligner();
        this.adjacentVerticalBottom = new AdjacentVerticalBottomAligner();
        this.adjacentBottom = new AdjacentBottomAligner();
        this.adjacentTopLeft = new AdjacentTopLeftAligner();
        this.adjacentTopRight = new AdjacentTopRightAligner();
        this.adjacentBottomLeft = new AdjacentBottomLeftAligner();
        this.adjacentBottomRight = new AdjacentBottomRightAligner();
        this.distributeLeft = new DistributeLeftAligner();
        this.distributeHorizontal = new DistributeHorizontalAligner();
        this.distributeRight = new DistributeRightAligner();
        this.distributeTop = new DistributeTopAligner();
        this.distributeVertical = new DistributeVerticalAligner();
        this.distributeBottom = new DistributeBottomAligner();
        this.matchWidth = new MatchWidthAligner();
        this.matchHeight = new MatchHeightAligner();
        this.matchSize = new MatchSizeAligner();
        this.scaleToFit = new ScaleToFitAligner();
        this.scaleToFill = new ScaleToFillAligner();
        this.spaceHorizontal = new SpaceHorizontalAligner();
        this.spaceInsideHorizontal = new SpaceInsideHorizontalAligner();
        this.spaceVertical = new SpaceVerticalAligner();
        this.spaceInsideVertical = new SpaceInsideVerticalAligner();
        this.stackHorizontal = new StackHorizontalAligner();
        this.stackVertical = new StackVerticalAligner();
        this.flipHorizontal = new FlipHorizontalAligner();
    };

    return Align;

});