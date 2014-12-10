/* global directives, utils */
directives.src = function (module) {
    module.directive('hbSrc', function () {
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
