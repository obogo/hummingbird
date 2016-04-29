//! pattern /\)\.text\(/
internal('query.text', ['query'], function (query) {
    query.fn.text = function (val) {
        if (this.length) {
            var el = this[0];
            if (arguments.length > 0) {
                this.each(function (index, el) {
                    el.innerText = val;
                });
            }
            return el.innerText;
        }
    };
});