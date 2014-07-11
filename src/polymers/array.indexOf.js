(function () {
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (value) {
            var i = 0, len = this.length, item;
            while (i < len) {
                if (value === this[i]) return i;
                i += 1;
            }
            return -1;
        };
    }
}());