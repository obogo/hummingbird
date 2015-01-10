//! pattern /hb\-cloak(\s|\=)/
internal('hbd.cloak', ['hb.directive'], function (directive) {
    directive('hbCloak', function ($app) {
        return {
            link: function (scope, el, alias) {
                scope.$on('hb::ready', function () {
                    el.removeAttribute(alias.name);
                });
            }
        };
    });
});
