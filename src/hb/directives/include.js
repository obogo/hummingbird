//! pattern /hb\-view(=|\s+|>)/
internal('hbd.include', ['hb.directive', 'hb.template'], function (directive, template) {
    directive('hbInclude', function ($app) {
        return {
            link: ['scope', 'el', 'alias', function (scope, el, alias) {
                var lastTpl = '';
                function onChange(tpl) {
                    if (el.children.length) {
                        $app.removeChild(el.children[0]);
                    }
                    return $app.addChild(el, tpl);
                }

                function onRouteChange(newVal, oldVal) {
                    var tpl = $app.val(newVal);
                    if (!tpl) {
                        template.get($app, newVal, function(content) {
                            $app.val(newVal, content);
                            onRouteChange(newVal, oldVal);
                            return;
                        });
                    }
                    if (lastTpl !== tpl) {
                        lastTpl = tpl;
                        onChange(tpl);
                        scope.$digest();
                    }
                }

                if (alias.value) {
                    scope.$watch(alias.value, onRouteChange);
                }
            }]
        };
    });
});
