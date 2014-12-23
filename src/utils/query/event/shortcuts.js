require('query', 'isDefined', 'each', function (query, isDefined) {
    query.fn.change = function (handler) {
        var scope = this;
        if (isDefined(handler)) {
            scope.on('change', handler);
        } else {
            scope.trigger('change');
        }
        return scope;
    };


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
