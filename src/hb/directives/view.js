//! pattern /hb\-view(=|\s+|>)/
internal('hbd.view', ['hb.directive', 'hb.template'], function (directive, template) {
    directive('hbView', function ($app) {
        return {
            link: ['scope', 'el', 'alias', function (scope, el, alias) {
                scope.title = 'view';
                var lastTemplate = '';
                function onChange(tpl) {
                    if (lastTemplate !== tpl) {
                        // only remove and recompile if the template has not changed. scope.$state wills till be updated.
                        if (el.children.length) {
                            $app.removeChild(el.children[0]);
                        }
                        return $app.addChild(el, tpl);
                    }
                    return el;
                }

                if (alias.value) {
                    scope.$watch(alias.value, onChange);
                }

                function onRouteChange(evt, state, params, prevState) {
                    var tpl = $app.val(state.template);
                    if (!tpl) {
                        template.get($app, state.template, function(content) {
                            $app.val(state.template, content);
                            onRouteChange(evt, state, params, prevState);
                            return;
                        });
                    }
                    var child = onChange(tpl);
                    if (child) {
                        // always expose the route on the $rootScope
                        child.scope.$r.$route = {current: state, params: params, prev: prevState};
                    }
                    scope.$apply();
                }

                scope.$on('router::change', onRouteChange);
            }]
        };
    });
});
