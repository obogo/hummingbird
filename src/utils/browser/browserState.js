define('browserState', ['dispatcher'], function (dispatcher) {

    var scope = dispatcher({});

    // check if browser window has focus
    var notIE = document.documentMode === undefined;
    var isChromium = window.chrome;

    if (notIE && !isChromium) {
        // checks for Firefox and other  NON IE Chrome versions
        window.addEventListener('focusin', function () {
            setTimeout(function () {
                scope.dispatch('changed', 'active');
            }, 300);
        });

        window.addEventListener('focusout', function () {
            scope.dispatch('changed', 'inactive');
        });
    } else {
        // checks for IE and Chromium versions
        if (window.addEventListener) {
            // bind focus event
            window.addEventListener('focus', function (event) {
                setTimeout(function () {
                    scope.dispatch('changed', 'active');
                }, 300);
            }, false);

            // bind blur event
            window.addEventListener('blur', function (event) {
                scope.dispatch('changed', 'inactive');
            }, false);
        } else {

            // bind focus event
            window.attachEvent('focus', function (event) {
                setTimeout(function () {
                    scope.dispatch('changed', 'active');
                }, 300);
            });

            // bind focus event
            window.attachEvent('blur', function (event) {
                scope.dispatch('changed', 'inactive');
            });
        }
    }

    return scope;
});