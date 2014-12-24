internal('window.console', function(){
    if (!('console' in window)) {
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
        };
    }
    return true;
});
