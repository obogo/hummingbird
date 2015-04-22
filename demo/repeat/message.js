define('hb.message', ['hb.directive'], function(directive) {
    directive('hbMessage', function() {
        return {
            scope: true,
            link: function(scope, el, attr) {
                scope.align = scope.item.name.indexOf('th') !== -1;
            }
        }
    });
});