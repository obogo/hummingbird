(function () {
    app.directives.html = function (name, module) {
        module.directive('goHtml', function () {
            return {
                link: function (scope, el, alias) {
                    scope.$watch(alias.value, function (newVal) {
                        el.innerHTML = newVal || '';
                    });
                }
            };
        });
    };
}());