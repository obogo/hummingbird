//! pattern /(\s|query)\(.*?\)\.change\(/
//! import query.trigger
internal('query.change', ['query', 'isDefined'], function (query, isDefined) {
    query.fn.change = function (handler) {
        var scope = this;
        if (isDefined(handler)) {
            scope.on('change', handler);
        } else {
            scope.trigger('change');
        }
        return scope;
    };
});
