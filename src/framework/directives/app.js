internal('directives.app', ['framework', 'ready'], function (framework, ready) {

    return framework.directives.app = function (module) {

        module.directive(module.name + 'App', function () {
            return {
                link: function (scope, el) {
                }
            };
        });

        ready(function () {
            var el = document.querySelector('[' + module.name + '-app]');
            if (el) {
                module.bootstrap(el);
            }
        });
    };

});
