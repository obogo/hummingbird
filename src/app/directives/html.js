/* global app */
app.directives.html = function (module) {
    module.directive(module.name + 'html', function () {
        return {
            link: function (scope, el, alias) {
                scope.$watch(alias.value, function (newVal) {
                    el.innerHTML = newVal || '';
                });
            }
        };
    });
};
