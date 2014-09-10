(function () {
    app.directives.src = function (module, namespace) {
        namespace = namespace || app.consts.PREFIX;

        module.directive(namespace + 'src', function (module) {
            return {
                link: function (scope, el, alias) {
                    var src = 'src';
                    scope.$watch(alias.value, function (newVal) {
                        if (newVal) {
                            el.setAttribute(src, newVal);
                        } else {
                            el.removeAttribute(src);
                        }
                    });
                }
            };
        });

    };
}());