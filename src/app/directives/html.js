(function () {
    app.directives.html = function (module, namespace) {

        namespace = namespace || app.consts.PREFIX;

        module.directive(namespace + 'html', function (module) {
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