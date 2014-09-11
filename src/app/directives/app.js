/* global app, browser */
app.directives.app = function (module) {
    console.log('we are here');
    module.directive(module.name + 'app', function (module) {
        return {
            link: function (scope, el) {
                console.log('app::init', module.name);
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
