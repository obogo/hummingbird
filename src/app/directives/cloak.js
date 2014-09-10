(function () {
    app.directives.cloak = function (name, module) {
        module.directive('goCloak', function () {
            return {
                link: function (scope, el, alias) {
                    el.removeAttribute(alias.name);
                }
            };
        });
    };
}());