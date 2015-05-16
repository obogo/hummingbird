//! pattern /hb\-enter\=/
internal('hbd.enter', ['hb.directive', 'query'], function (directive, query) {
    directive('hbEnter', function () {
        return {
            link: ['scope', 'el', 'alias', function (scope, el, alias) {
                var $el = query(el);

                function onKey(evt) {
                    if (evt.keyCode === 13) {
                        scope.$apply(alias.value);
                    }
                }

                $el.on('keypress', onKey);
                scope.$on('$destroy', function () {
                    $el.off('keypress', onKey);
                })
            }]
        }
    });
});