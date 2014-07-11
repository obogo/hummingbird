/*global query */
query.fn.get = function (index) {
    if (validators.isDefined(index)) {
        if (Math.abs(index) < this.length) {
            if (index < 0) {
                return this[this.length + index - 1];
            }
            return this[index];
        }
        return this;
    }
    return this.splice(0);
};