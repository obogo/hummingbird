internal('directives.cloak', ['framework'], function (framework) {
    return framework.directives.cloak = function (module) {
        module.directive('hbCloak', function () {
            return {
                link: function (scope, el, alias) {
                    scope.$on('module::ready', function() {
                        el.removeAttribute(alias.name);
                    });
                }
            };
        });
    };
});
