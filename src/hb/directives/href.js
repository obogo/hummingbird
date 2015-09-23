//! pattern /hb\-href\=/
internal('hbd.href', ['hb.directive'], function (directive) {
    directive('hbHref', function () {
        return {
            link: ['scope', 'el', 'alias', function (scope, el, alias) {
                var href = 'href';
                scope.$watch(alias.value, function (newVal) {
                    if (newVal) {
                        el.setAttribute(href, newVal);
                    } else {
                        el.removeAttribute(href);
                    }
                });
            }]
        };
    });
});
