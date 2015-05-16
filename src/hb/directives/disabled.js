//! pattern /hb\-disabled(\s|\=|>)/
internal('hbd.disabled', ['hb.directive'], function (directive) {
    directive('hbDisabled', function () {
        return {
            link: ['scope', 'el', 'alias', function (scope, el, alias) {
                var disabled = 'disabled';
                scope.$watch(alias.value, function (newVal) {
                    if (newVal) {
                        el.setAttribute(disabled, disabled);
                    } else {
                        el.removeAttribute(disabled);
                    }
                });
            }]
        };
    });
});
