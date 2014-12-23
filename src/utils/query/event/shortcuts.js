internal('query.shortcuts', ['query', 'isDefined'], function (query, isDefined) {
    //! query.change
    query.fn.change = function (handler) {
        var scope = this;
        if (isDefined(handler)) {
            scope.on('change', handler);
        } else {
            scope.trigger('change');
        }
        return scope;
    };


    //! query.click
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
