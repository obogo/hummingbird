//! pattern /hb\-view(=|\s+|>)/
internal('hbd.view', ['hb.directive', 'hb.debug'], function (directive, debug) {
    var afterChangeSet = false;
    directive('hbView', ['$app', '$router', '$rootScope', function ($app, $router, $rootScope) {
        if (!afterChangeSet) {
            afterChangeSet = true;
            $router.on($router.events.AFTER_CHANGE, function () {
                $rootScope.$apply();
            });
        }
        return {
            link: ['scope', 'el', 'alias', function (scope, el, alias) {
                scope.title = 'view';
                var lastUrl = '';

                function removeContents() {
                    if (el.children.length) {
                        var s = el.children[0].scope;
                        if (s) {
                            s.$broadcast('$destroy');
                        }
                        $app.removeChild(el.children[0]);
                    }
                }

                function getTemplateUrl(route) {
                    if (alias.value) {
                        if (route.current.views && route.current.views[alias.value]) {
                            return route.current.views[alias.value].template;
                        }
                        return '';
                    } else {
                        return route.current.template;
                    }
                }

                // all contents must be removed that are going to change before the new content is inserted
                // so we don't get orphaned scopes.
                function onResolveRoute(evt, route) {
                    var url = getTemplateUrl(route), s;
                    if (url && url !== lastUrl) {
                        removeContents();
                    }
                }

                function onRouteChange(evt, route) {
                    var url = getTemplateUrl(route);
                    if (url && url !== lastUrl) {
                        lastUrl = url;
                        var tpl = $app.val(url);
                        $app.addChild(el, tpl);
                        debug.info("%crendered", "font-weight:bold", alias.value);
                    }
                }

                $router.on($router.events.RESOLVE_VIEW, onResolveRoute);// remove views that will be replaced.
                $router.on($router.events.CHANGE, onRouteChange);// insert new content.
                if (!$router.isProcessing()) {
                    onRouteChange(null, $router.data);
                }
            }]
        };
    }]);
});
