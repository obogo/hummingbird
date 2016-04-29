/**!
 * pattern /class\=("|')([^\1]|.*?)\{\{.*?(\1)/
 */
internal('hb.attr.class', ['hb.directive'], function (directive) {
    directive('class', function () {
        return {
            link: ['scope', 'el', '$app', function (scope, el, $app) {
                var len = el.classList.length,
                    bindClasses = [],
                    watchId;
                for (var i = 0; i < len; i += 1) {
                    if (el.classList[i].indexOf($app.bindingMarkup[0]) !== -1) {
                        bindClasses.push({
                            bindOnce: scope.$isBindOnce(el.classList[i]),
                            bind: el.classList[i],
                            last: ''
                        });
                        el.classList.remove(el.classList[i]);
                        i -= 1;
                        len -= 1;
                    }
                }
                function classAttr() {
                    this.expr = 'class';
                    var i, len = bindClasses.length, result, item;
                    for (i = 0; i < len; i += 1) {
                        item = bindClasses[i];
                        result = $app.parseBinds(scope, item.bind);
                        if (result !== item.last && item.last) {
                            el.classList.remove(item.last);
                        }
                        if (result) {
                            el.classList.add(result);
                        }
                        if (item.bindOnce) {
                            bindClasses.splice(i, 1);
                            i -= 1;
                            if (!bindClasses.length) {
                                scope.$unwatch(watchId);
                            }
                        }
                        item.last = result;
                    }
                }

                if (bindClasses.length) {
                    watchId = scope.$watch(classAttr);
                }
                // destroy references in closures so they get collected.
                scope.$on('$destroy', function () {
                    bindClasses.length = 0;
                    scope = null;
                    el = null;
                    $app = null;
                });
            }]
        };
    });
});