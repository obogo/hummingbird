/* global app, browser */
app.directives.app = function (module) {
    module.directive(module.name + 'app', function () {
        return {
            link: function (scope, el) {
            }
        };
    });

    browser.ready(function () {
        var el = document.querySelector('[' + module.name + '-app]');
        if(el) {
            module.bootstrap(el);
        }
    });
};
