/*global query, validators */
utils.query.fn.change = function (handler) {
    if (utils.validators.isDefined(handler)) {
        this.on('change', handler);
    } else {
        this.trigger('change');
    }
    return this;
};

utils.query.fn.click = function (handler) {
    if (validators.isDefined(handler)) {
        this.bind('click', handler);
    } else {
        this.trigger('click');
    }
    return this;
};