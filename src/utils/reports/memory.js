define('memory', function () {
    var typeObj = 'object';
    var memory = {
        getSize: function (obj) {
            return this.getBytesSize(this.sizeOfObject(obj));
        },

        /**
         * Get the estimated size in memory of an object.
         * @param {Object} value
         * @param {Number=} level
         * @returns {number}
         */
        sizeOfObject: function (value, level) {
            if (level == undefined) level = 0;
            var bytes = 0, i;
            if (value === null || value === undefined) {
                bytes = 0;
            } else if (typeof value === 'boolean') {
                bytes = 4;
            } else if (typeof value === 'string') {
                bytes = value.length * 2;
            } else if (typeof value === 'number') {
                bytes = 8;
            } else if (typeof value === 'object') {
                if (value['__visited__']) return 0;
                value['__visited__'] = 1;
                for (i in value) {
                    if (value.hasOwnProperty(i)) {
                        bytes += i.length * 2;
                        bytes += 8; // an assumed existence overhead
                        bytes += this.sizeOfObject(value[i], 1);
                    }
                }
            }

            if (level == 0) {
                this._clearReferenceTo(value);
            }
            return bytes;
        },

        _clearReferenceTo: function (value, parent) {
            if (value && typeof value === typeObj) {
                delete value['__visited__'];
                for (var i in value) {// if it doesn't have it's own property memory is on the prototype. So don't count it.
                    if (value.hasOwnProperty(i) && value[i] && value[i] !== parent && value[i] !== value && typeof value[i] === typeObj) {// prevent recursion
                        this._clearReferenceTo(value[i], value);
                    }
                }
            }
        },

        getBytesSize: function (bytes) {
            if (bytes > 1024 && bytes < 1024 * 1024) {
                return (bytes / 1024).toFixed(2) + "K";
            }
            else if (bytes > 1024 * 1024 && bytes < 1024 * 1024 * 1024) {
                return (bytes / (1024 * 1024)).toFixed(2) + "M";
            }
            else if (bytes > 1024 * 1024 * 1024) {
                return (bytes / (1024 * 1024 * 1024)).toFixed(2) + "G";
            }
            return bytes.toString();
        }
    };

    return memory;

});
