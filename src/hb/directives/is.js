define('hbIs', ['hb.directive'], function(directive) {
    directive('hbIs', function() {
        return {
            link: ['scope', 'el', 'alias', 'attr', function(scope, el, alias, attr) {
                scope.$watch(alias.value, function(newVal) {
                    var n = 'is' + newVal;
                    if (attr[n]) {
                        scope.$eval(attr[n]);
                    }
                });
            }]
        };
    });
});