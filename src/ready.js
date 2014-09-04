var ready = (function () {
    var ary = [];
    function ready(fn) {
        if (!fn) {
            while(ary.length) {
                ary.shift()();
            }
        } else {
            ary.push(fn);
        }
    }
}());