(function () {
    app.directives.src = function (name, module) {
        module.directive('goSrc', function () {
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