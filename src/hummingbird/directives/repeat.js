/* global app, module */
hummingbird.directives.repeat = function (module) {
    module.set(module.name + 'Repeat', function () {
        return {
            scope:true,
            link: function (scope, el, alias) {
                var template = el.children[0].outerHTML;
                el.removeChild(el.children[0]);
                var statement = alias.value;
                statement = helpers.each(statement.split(/\s+in\s+/), hummingbird.utils.trimStrings);
                var itemName = statement[0],
                    watch = statement[1];

                function render(list, oldList) {
                    var i = 0, len = Math.max(list.length, el.children.length), child, s;
                    while (i < len) {
                        child = el.children[i];
                        if (!child) {
                            child = module.addChild(el, template);
                        }
                        if (list[i]) {
                            s = child.scope;
                            s[itemName] = list[i];
                            s.$index = i;
                        } else {
                            child.scope.$destroy();
                        }
                        i += 1;
                    }
                }

                scope.$watch(watch, render, true);
            }
        };
    });
};
