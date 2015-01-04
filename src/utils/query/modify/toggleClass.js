/**
 * import query.addClass
 * import query.hasClass
 * import query.removeClass
 */
internal('query.toggleClass', ['query'], function (query) {
    query.fn.toggleClass = function (className) {
        var classes = className.split(' ');
        var $el;
        this.each(function (index, el) {
            $el = query(el);
            for (var e in classes) {
                className = classes[e];
                if ($el.hasClass(className)) {
                    console.log('removeClass', className);
                    $el.removeClass(className);
                } else {
                    console.log('addClass', className);
                    $el.addClass(className);
                }
            }
        });
        return this;
    };
});