define('copy', ['apply', 'extend'], function(apply, extend) {
    function copy(source) {
        return apply(extend, this, [{}, source]);
    }
    return copy;
});