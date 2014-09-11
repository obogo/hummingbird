/* global app, module */
app.directives.repeat = function (module) {

    // create repeat directive
    module.set(module.name + 'Repeat', function () {
        return {
            scope:true,
            link: function (scope, el, alias) {
                var template = el.children[0].outerHTML;
                el.removeChild(el.children[0]);
                var statement = alias.value;
                statement = helpers.each(statement.split(/\s+in\s+/), app.utils.trimStrings);
                var itemName = statement[0],
                    watch = statement[1];

                function render(list, oldList) {
                    var i = 0, len = Math.max(list.length, el.children.length), child, s;
                    while (i < len) {
                        child = el.children[i];
                        if (!child) {
                            child = module.addChild(el, template);
//                                el.insertAdjacentHTML('beforeend', formatters.stripHTMLComments(template));
//                                child = el.children[el.children.length - 1];
//                                child.setAttribute(prefix + '-repeat-item', '');
//                                compile(child, scope);
                        }
                        if (list[i]) {
                            s = child.scope;
                            s[itemName] = list[i];
                            s.$index = i;
//                                compileWatchers(child, s);
                        } else {
                            child.scope.$destroy();
                        }
                        i += 1;
                    }
//                        compileWatchers(el, scope);
                }

                scope.$watch(watch, render);
            }
        };
    });
//
//    module.set(prefix + 'RepeatItem', function () {
//        return {
//            scope: true,
//            link: function (scope, el) {
//            }
//        };
//    });
};
