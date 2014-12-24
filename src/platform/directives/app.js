/* global directives, utils */
internal('directives.app', function () {
    return function (module) {
        module.directive(module.name + 'App', function () {
            return {
                link: function (scope, el) {
                }
            };
        });

        utils.browser.ready(function () {
            var el = document.querySelector('[' + module.name + '-app]');
            if(el) {
                module.bootstrap(el);
            }
        });
    };
});
