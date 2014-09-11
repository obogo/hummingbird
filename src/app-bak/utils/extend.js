app.utils.extend = function (target, source) {
    var args = Array.prototype.slice.call(arguments, 0), i = 1, len = args.length, item, j;
    while (i < len) {
        item = args[i];
        for (j in item) {
            if (item.hasOwnProperty(j)) {
                target[j] = source[j];
            }
        }
        i += 1;
    }
    return target;
}