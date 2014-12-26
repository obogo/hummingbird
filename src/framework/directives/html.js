internal('directives.html', ['framework'], function (framework) {
    return framework.directives.html = function (module) {
        module.directive('hbHtml', function () {
            return {
                link: function (scope, el, alias) {
                    scope.$watch(alias.value, function (newVal) {
                        el.innerHTML = newVal || '';
                    });
                }
            };
        });
    };
});
