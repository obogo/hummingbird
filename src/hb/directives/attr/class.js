/**!
 * pattern /class\=("|').*?(\1)/
 * patterns-not-working /class\=("|')([^\1]|.*?)\{\{.*?(\1)/
 */
internal('hb.attr.class', ['hb.directive'], function(directive) {
    directive('class', function() {
        return {
            link: ['scope', 'el', '$app', function(scope, el, $app) {
                var val = 'class',
                    str = el.getAttribute(val),
                    lastResult = '';
                scope.$watch(function() {
                    var result = $app.parseBinds(scope, str);
                    if (result !== lastResult) {
                        lastResult = result;
                        el.setAttribute(val, result);
                    }
                });
            }]
        };
    });
});