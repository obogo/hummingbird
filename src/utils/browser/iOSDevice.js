define('iOSDevice', function() {
    var iOSRx = /iPad|iPhone|iPod/;
    var iOSiPodRx = /iPod/;
    var iOSiPhoneRx = /iPhone/;
    var iOSiPadRx = /iPad/;

    function isIt(rx) {
        return rx.test(navigator.platform) || (rx.test(navigator.userAgent) && !window.MSStream);
    }

    return {
        is: function() {
            return isIt(iOSRx);
        },
        isIPod: function() {
            return isIt(iOSiPodRx);
        },
        isIPhone: function () {
            return isIt(iOSiPhoneRx);
        },
        isIPad: function() {
            return isIt(iOSiPadRx);
        }
    }
});