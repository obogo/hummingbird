//! pattern /\)\.isChecked\(/
internal('query.isChecked', ['query'], function (query) {
    query.fn.isChecked = function () {
        if (this.length) {
            return this[0].checked;
        }
        return false;
    };
})