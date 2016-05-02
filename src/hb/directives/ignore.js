//! pattern /hb\-ignore(\s|\=|>)/
internal('hbIgnore', ['hb.directive'], function (directive) {
    directive('hbIgnore', function () {
        return {
            scope: true,
            link: ['scope', function (scope) {
                scope.$ignore(true);
            }]
        };
    });
});
