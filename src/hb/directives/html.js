//! pattern /hb\-html\=/
internal('hbd.html', ['hb.directive'], function (directive) {
    directive('hbHtml', function () {
        return {
            link: ['scope', 'el', 'alias', function (scope, el, alias) {
                scope.$watch(alias.value, function (newVal) {
                    el.innerHTML = newVal || '';
                });
            }]
        };
    });
});
