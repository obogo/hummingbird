/*global query */
query.fn.addClass = function (className) {
    var scope = this;
    this.each(function (index, el) {
        if (!scope.hasClass(el, className)) {
            el.className += ' ' + className;
        }
    });
    return this;
};

query.fn.hasClass = function (className) {
    var el = this[0];
    if (el.classList) {
        return el.classList.contains(className);
    } else {
        return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
    }
    return false;
};

query.fn.removeClass = function (className) {
    var scope = this;
    this.each(function (index, el) {
        if (isDefined(className)) {
            var newClass = ' ' + el.className.replace(/[\t\r\n]/g, ' ') + ' ';
            if (scope.hasClass(el, className)) {
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