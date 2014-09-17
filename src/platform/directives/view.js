/* global directives, utils */
directives.view = function (module) {
    module.directive('view', function () {
        return {
            link: function (scope, el, alias) {
                scope.title = 'view';
                function onChange(newVal) {
                    if (el.children.length) {
                        module.removeChild(el.children[0]);
                    }
                    return module.addChild(el, module.get(newVal));
                }
                if (alias.value) {
                    scope.$watch(alias.value, onChange);
                }
                scope.$on('router::change', function(evt, state, params, prevState) {
                    var child = onChange(state.templateName, null, params);
                    if (child) {
                        child.scope.$state = {current: state, prev: prevState, params: params};
                    }
                    scope.$apply();
                });
            }
        };
    });
};
