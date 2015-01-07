internal('hbd.view', ['hb.directive'], function (directive) {
    directive('hbView', function ($app) {
        return {
            link: function (scope, el, alias) {
                scope.title = 'view';
                function onChange(newVal) {
                    if (el.children.length) {
                        $app.removeChild(el.children[0]);
                    }
                    return $app.addChild(el, $app.val(newVal));
                }

                if (alias.value) {
                    scope.$watch(alias.value, onChange);
                }
                scope.$on('router::change', function (evt, state, params, prevState) {
                    var child = onChange(state.templateName, null, params);
                    if (child) {
                        child.scope.$state = {current: state, params: params, prev: prevState};
                    }
                    scope.$apply();
                });
            }
        };
    });
});
