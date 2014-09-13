/* global directives, utils */
directives.app = function (module) {
    module.directive('app', function () {
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
