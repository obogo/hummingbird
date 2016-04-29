/**!
 * import query.hasClass
 *
 * all matches must be matched for it to be included.
 * pattern /\)\.addClass\(/
 */
internal('query.addClass', ['query'], function (query) {
    query.fn.addClass = function (className) {
        var $el;
        this.each(function (index, el) {
            $el = query(el, this.context);
            if (!$el.hasClass(className)) {
                el.className += ' ' + className;
            }
        });
        return this;
    };
});