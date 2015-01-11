//! pattern /hb\-ignore(\s|\=|>)/
internal('hbd.ignore', ['hb.directive'], function (directive) {
    directive('hbIgnore', function () {
        return {
            scope: true,
            link: function (scope, el, alias) {
                scope.$ignore(true);
            }
        };
    });
});
