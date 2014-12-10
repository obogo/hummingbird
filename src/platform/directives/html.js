/* global directives, utils */
directives.html = function (module) {
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
