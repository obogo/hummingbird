internal('query.addClass', ['query'], function (query) {
    query.fn.addClass = function (className) {
        var $el;
        this.each(function (index, el) {
            $el = query(el);
            if (!$el.hasClass(className)) {
                el.className += ' ' + className;
            }
        });
        return this;
    };
});