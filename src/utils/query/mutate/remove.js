/*global query */
internal('query.remove', ['query'], function (query) {
    query.fn.remove = function () {
        this.each(function (index, el) {
            if (el.parentElement) {
                el.parentElement.removeChild(el);
            }
        });
    };
});