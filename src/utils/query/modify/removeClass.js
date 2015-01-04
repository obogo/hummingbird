internal('query.removeClass', ['query', 'isDefined'], function (query, isDefined) {
    query.fn.removeClass = function (className) {
        var $el;
        this.each(function (index, el) {
            $el = query(el);
            if (isDefined(className)) {
                var newClass = ' ' + el.className.replace(/[\t\r\n]/g, ' ') + ' ';
                if ($el.hasClass(className)) {
                    while (newClass.indexOf(' ' + className + ' ') >= 0) {
                        newClass = newClass.replace(' ' + className + ' ', ' ');
                    }
                    el.className = newClass.replace(/^\s+|\s+$/g, '');
                }
            } else {
                el.className = '';
            }
        });
        return this;
    };
});