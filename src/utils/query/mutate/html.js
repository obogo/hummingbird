//! pattern /\)\.html\(/
internal('query.html', ['query'], function (query) {
    query.fn.html = function (val) {
        if (this.length) {
            var el = this[0];
            if (arguments.length > 0) {
                this.each(function (index, el) {
                    el.innerHTML = val;
                });
            }
            return el.innerHTML;
        }
    };
});