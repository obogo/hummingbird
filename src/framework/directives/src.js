internal('directives.src', ['framework'], function (framework) {
    return framework.directives.src = function (module) {
        return module.directive('hbSrc', function () {
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
});
