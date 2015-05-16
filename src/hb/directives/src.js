//! pattern /hb\-src\=/
internal('hbd.src', ['hb.directive'], function (directive) {
    directive('hbSrc', function () {
        return {
            link: ['scope', 'el', 'alias', function (scope, el, alias) {
                var src = 'src';
                scope.$watch(alias.value, function (newVal) {
                    if (newVal) {
                        el.setAttribute(src, newVal);
                    } else {
                        el.removeAttribute(src);
                    }
                });
            }]
        };

    });
});
