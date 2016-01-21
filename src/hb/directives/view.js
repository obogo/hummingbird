//! pattern /hb\-view(=|\s+|>)/
internal('hbd.view', ['hb.directive', 'hb.template'], function (directive, template) {
    directive('hbView', ['$app', '$router', function ($app, $router) {
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

                function onRouteChange(evt, route) {
                    var tpl = $app.val(route.current.template);
                    if (!tpl) {
                        template.get($app, route.current.template, function(content) {
                            $app.val(route.current.template, content);
                            onRouteChange(evt, route);
                            return;
                        });
                    }
                    var child = onChange(tpl);
                    if (child) {
                        // always expose the route on the $rootScope
                        child.scope.$r.$route = route;
                    }
                    scope.$apply();
                }

                $router.on($router.events.CHANGE, onRouteChange);
                onRouteChange(null, $router.data);
            }]
        };
    }]);
});
