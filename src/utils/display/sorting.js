/* global display */
internal('sorting', function () {
    var Sorting = function () {

        var that = this;

        /**
         * compares two numbers and returns standard sort values
         * @param a
         * @param b
         * @return {Number}
         */
        that.compareNumber = function (a, b) {
            return (a > b) ? 1 : (a < b) ? -1 : 0;
        };

        /**
         * sort method for Rectangle by the .width property
         * @param a
         * @param b
         * @return {*}
         */
        that.sortRectWidth = function (a, b) {
            return that.compareNumber(a.bounds.width, b.bounds.width);
        };

        /**
         * sort method for the Rectangle by the .height property
         * @param a
         * @param b
         * @return {*}
         */
        that.sortRectHeight = function (a, b) {
            return that.compareNumber(a.bounds.height, b.bounds.height);
        };

        /**
         * sort method for Rectangle by the .left property
         * @param a
         * @param b
         * @return {Number}
         */
        that.sortRectLeft = function (a, b) {
            return that.compareNumber(a.bounds.left(), b.bounds.left());
        };

        /**
         * sort method for Rectangle by the .right property
         * @param a
         * @param b
         * @return {Number}
         */
        that.sortRectRight = function (a, b) {
            return that.compareNumber(a.bounds.right(), b.bounds.right());
        };

        /**
         * sort method for Rectangle by the .top property
         * @param a
         * @param b
         * @return {Number}
         */
        that.sortRectTop = function (a, b) {
            return that.compareNumber(a.bounds.top(), b.bounds.top());
        };

        /**
         * sort method for Rectangle by the .bottom property
         * @param a
         * @param b
         * @return {Number}
         */
        that.sortRectBottom = function (a, b) {
            return that.compareNumber(a.bounds.bottom(), b.bounds.bottom());
        };

        /**
         * sort method for Rectangle by the middle point on the x axis
         * @param a
         * @param b
         * @return {Number}
         */
        that.sortRectCenterX = function (a, b) {
            return that.compareNumber(a.bounds.centerX(), b.bounds.centerX());
        };

        /**
         * sort method for Rectangle by the middle point on the y axis
         * @param a
         * @param b
         * @return {Number}
         */
        that.sortRectCenterY = function (a, b) {
            return that.compareNumber(a.bounds.centerY(), b.bounds.centerY());
        };

        /**
         * sort method for Rectangle by the .left property then by the .right property if equal
         * @param a
         * @param b
         * @return {*}
         */
        that.sortRectAdjacentLeft = function (a, b) {
            var i = that.sortRectLeft(a, b);
            if (i === 0) {
                i = that.sortRectRight(a, b);
            }
            return i;
        };

        /**
         * sort method for Rectangle by the .right property, then by the .left property if they are equal
         * @param a
         * @param b
         * @return {Number}
         */
        that.sortRectAdjacentRight = function (a, b) {
            var i = that.sortRectRight(a, b);
            if (i === 0) {
                i = that.sortRectLeft(a, b);
            }
            return i;
        };

        /**
         * sort method for Rectangle by the .top property, then by .bottom property if equal
         * @param a
         * @param b
         * @return {Number}
         */
        that.sortRectAdjacentTop = function (a, b) {
            var i = that.sortRectTop(a, b);
            if (i === 0) {
                i = that.sortRectBottom(a, b);
            }
            return i;
        };

        /**
         * sort method for Rectangle by the .bottom property then by the .top property if equal
         * @param a
         * @param b
         * @return {*}
         */
        that.sortRectAdjacentBottom = function (a, b) {
            var i = that.sortRectBottom(a, b);
            if (i === 0) {
                i = that.sortRectTop(a, b);
            }
            return i;
        };
    };

    return Sorting;

});