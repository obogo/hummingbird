//! pattern /hb\-show\=/
define('hbShow', ['hb.directive'], function (directive) {
    directive('hbShow', function () {
        return {
            scope: true,
            link: ['scope', 'el', 'alias', function (scope, el, alias) {
                scope.$watch(alias.value, function (newVal, oldVal) {
                    if (newVal) {
                        scope.$ignore(false, true);
                        el.style.display = null;
                    } else {
                        scope.$ignore(true, true);
                        el.style.display = 'none';
                    }
                });
            }]
        };
    });
});
