/*global query */
utils.query.fn.empty = function () {
    this.each(function (index, el) {
        el.innerHTML = null;
    });
};