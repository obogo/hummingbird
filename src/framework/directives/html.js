internal('hbd.html', ['hb.directive'], function (directive) {
    directive('hbHtml', function () {
        return {
            link: function (scope, el, alias) {
                scope.$watch(alias.value, function (newVal) {
                    el.innerHTML = newVal || '';
                });
            }
        };
    });
});
