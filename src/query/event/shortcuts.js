/*global query, validators */
query.fn.change = function (handler) {
    if (validators.isDefined(handler)) {
        this.on('change', handler);
    } else {
        this.trigger('change');
    }
    return this;
};

query.fn.click = function (handler) {
    if (validators.isDefined(handler)) {
        this.bind('click', handler);
    } else {
        this.trigger('click');
    }
    return this;
};