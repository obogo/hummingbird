//TODO: this needs to be fixed in multiple files. It is matching on things like str.replace(); We need to be able to chain the queries so we can match on previous matches so we can make sure we are using it on a variable that is defined with query.
//! pattern /(\w+|\))\.replace\(/
//! pattern /("|')query\1/
internal('query.replace', ['query'], function (query) {
    query.fn.replace = function (val) {
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