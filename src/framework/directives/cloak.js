internal('directives.cloak', ['framework'], function (framework) {
    return framework.directives.cloak = function (module) {
        module.directive('hbCloak', function () {
            return {
                link: function (scope, el, alias) {
                    el.removeAttribute(alias.name);
                }
            };
        });
    };
});
