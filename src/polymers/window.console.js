(function () {
    if (!'console' in window) {
        window.console = {
            isOverride: true,
            log: function () {
            },
            warn: function () {
            },
            info: function () {
            },
            error: function () {
            }
        }
    }
}());