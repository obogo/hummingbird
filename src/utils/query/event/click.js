//! pattern /(\s|query)\(.*?\)\.click\(/
//! import query.trigger
internal('query.click', ['query', 'isDefined'], function (query, isDefined) {
    query.fn.click = function (handler) {
        var scope = this;
        if (isDefined(handler)) {
            scope.bind('click', handler);
        } else {
            scope.trigger('click');
        }
        return scope;
    };
});
