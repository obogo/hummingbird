(function () {
    app.directives.cloak = function (module, namespace) {
        namespace = namespace || app.consts.PREFIX;

        module.directive(namespace + 'cloak', function (module) {
            return {
                link: function (scope, el, alias) {
                    el.removeAttribute(alias.name);
                }
            };
        });
    };
}());