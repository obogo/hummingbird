/* global directives, utils */
directives.cloak = function (module) {
    module.directive(module.name + 'cloak', function () {
        return {
            link: function (scope, el, alias) {
                el.removeAttribute(alias.name);
            }
        };
    });
};
