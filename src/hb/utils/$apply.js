//! pattern /\s+\$apply\(\w?\)/
internal('hb.apply', ['hb.val'], function (val) {
    var intv;
    var $rs;
    function applyLater() {
        intv = 0;
        $rs.$apply();
    }

    function applyQueue(wait) {
        if (!intv) {
            clearInterval(intv);
            if (!wait) {
                applyLater();
            } else {
                intv = setTimeout(applyLater, wait);
            }
        }
    }

    function setup($rootScope) {
        $rs = $rootScope;
        return applyQueue;
    }

    return val('$apply', ['$rootScope', setup]);
});