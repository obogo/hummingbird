internal('query.not', ['query'], function (query) {
    query.fn.not = function (selector) {
        if (this.length) {
            return query(':not(' + selector + ')', this[0]);
        }
        return query();
    };
});