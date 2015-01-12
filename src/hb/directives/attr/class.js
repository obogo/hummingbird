/**!
 * pattern /class\=("|').*?(\1)/
 * patterns-not-working /class\=("|')([^\1]|.*?)\{\{.*?(\1)/
 */
internal('hb.attr.class', ['hb.directive'], function(directive) {
    directive('class', function() {
        return {
            link: ['scope', 'el', '$app', function(scope, el, $app) {
                var len = el.classList.length,
                    bindClasses = [];
                for(var i = 0; i < len; i += 1) {
                    if (el.classList[i].indexOf($app.bindingMarkup[0]) !== -1) {
                        bindClasses.push({bind:el.classList[i], last:''});
                        el.classList.remove(el.classList[i]);
                        i -= 1;
                        len -= 1;
                    }
                }
                scope.$watch(function() {
                    var i, len = bindClasses.length, result, item;
                    for(i = 0; i < len; i += 1) {
                        item = bindClasses[i];
                        result = $app.parseBinds(scope, item.bind);
                        if (result !== item.last && item.last) {
                            el.classList.remove(item.last);
                        }
                        if (result) {
                            el.classList.add(result);
                        }
                        item.last = result;
                    }
                });
            }]
        };
    });
});