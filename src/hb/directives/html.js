//! pattern /hb\-html\=/
internal('hbd.html', ['hb.directive'], function (directive) {
    directive('hbHtml', function () {
        return {
            link: ['scope', 'el', 'alias', '$app', function (scope, el, alias, $app) {
                scope.$watch(alias.value, function (newVal) {
                    while(scope.$c.length) {
                        scope.$c.pop().$destroy();
                    }
                    el.innerHTML = newVal || '';
                    $app.compile(el.children[0], scope);
                });
            }]
        };
    });
});
