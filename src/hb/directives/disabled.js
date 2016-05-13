define('hbDisabled', ['hb.directive'], function(directive) {
    directive('hbDisabled', function() {
        return {
            link: ['scope', 'el', 'alias', function(scope, el, alias) {
                scope.$watch(alias.value, function(newVal) {
                    if (newVal) {
                        el.setAttribute('disabled','');
                    } else {
                        el.removeAttribute('disabled');
                    }
                })
            }]
        };
    });
});