/**
 * import query.addClass
 * import query.hasClass
 * import query.removeClass
 *
 * all matches must be matched for it to be included.
 * pattern /(\w+|\))\.toggleClass\(/
 * pattern /("|')query\1/
 */
internal('query.toggleClass', ['query'], function (query) {
    query.fn.toggleClass = function (className, on) {
        var classes = className.split(' ');
        var $el;
        this.each(function (index, el) {
            $el = query(el);
            for (var e in classes) {
                className = classes[e];
                if ($el.hasClass(className) && !on) {
                    $el.removeClass(className);
                } else if (on || on === undefined) {
                    $el.addClass(className);
                }
            }
        });
        return this;
    };
});