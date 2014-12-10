/* global directives, utils */
directives.cloak = function (module) {
    module.directive('hbCloak', function () {
        return {
            link: function (scope, el, alias) {
                el.removeAttribute(alias.name);
            }
        };
    });
};
