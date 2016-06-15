//! pattern /hb\-cloak(\s|\=|>)/
define('hbCloak', ['hb.directive', 'hb.eventStash'], function (directive, events) {
    directive('hbCloak', function () {
        return {
            link: ['scope', 'el', 'alias', function (scope, el, alias) {
                scope.$on(events.HB_READY, function () {
                    el.removeAttribute(alias.name);
                });
            }]
        };
    });
});
