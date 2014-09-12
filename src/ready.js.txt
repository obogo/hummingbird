var ready = (function () {
    var ary = [];
    return function (fn) {
        if (!fn) {
            while(ary.length) {
                ary.shift()();
            }
        } else {
            ary.push(fn);
        }
    };
}());