/*global query */
query.fn.append = function (elements) {
    var i, len;
    if (typeof elements === 'string') {
        elements = query(elements);
    }
    this.each(function (index, el) {
        i = 0;
        len = elements.length;
        while(i < len) {
            el.appendChild(elements[i].cloneNode(true));
            i += 1;
        }
    });
};