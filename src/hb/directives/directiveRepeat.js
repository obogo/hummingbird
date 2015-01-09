internal('hbd.directiveRepeat', ['hb.directive'], function (directive) {
    directive('hbDirectiveRepeat', ['$app', function ($app) {
        return {
            link: ['scope', 'el', 'alias', function (scope, el, alias) {
                var itemProperty = scope.$eval(el.getAttribute('item-property'));
                var typeMap = scope.$eval(el.getAttribute('type-map'));
                var tpl = '';
                if (el.children.length) {
                    tpl = el.children[0].outerHTML;
                    el.innerHTML = '';
                }
                function render(list, oldList) {
                    // allow single item string properties.
                    if (list && typeof list === "string" && list.length) {
                        list = [list];
                    }
                    if (list && list.length) {
                        var i = 0, len = Math.max(list.length || 0, el.children.length), child, s, dir, type, itemTpl;
                        while (i < len) {
                            child = el.children[i];
                            if (!child) {
                                type = list[i];
                                if (itemProperty) {
                                    type = type[itemProperty];
                                    if (typeMap) {
                                        type = typeMap[type] || typeMap.default;
                                    }
                                } else if (typeMap && typeMap[type]) {
                                    type = typeMap[type];
                                }
                                //console.log("type", type);
                                dir = $app.val(type.split('-').join(''));
                                if (dir) {
                                    dir = (dir.length ? dir[dir.length - 1] : dir)();
                                } else {
                                    throw new Error(type + " is not registered.");
                                }
                                if (!dir.scope) {
                                    throw new Error(alias.name + " can only support inherited or isolated scope children.");
                                }
                                s = scope.$new();
                                //TODO: need to make this property configurable instead of just data.
                                if (list[i] !== undefined && list[i] !== null && list[i] !== '') {
                                    s.model = list[i];
                                }
                                itemTpl = tpl ? tpl.replace(/<(\/?\w+)/g, '<' + type) : '<' + type + '></' + type + '>';
                                //console.log("\t" + itemTpl);
                                child = $app.addChild(el, itemTpl, s);
                            }
                            if (list[i]) {
                                s = child.scope;
                                s.model = list[i];
                                s.$index = i;
                            } else {
                                child.scope.$destroy();
                            }
                            i += 1;
                        }
                    } else {
                        while (el.children.length) {
                            child = el.children[0];
                            if (child.scope) {
                                child.scope.$destroy();
                            } else {
                                el.removeChild(child);
                            }
                        }
                    }
                    scope.$emit('hbDirectiveRepeat::render');
                }

                scope.$watch(alias.value, render, true);
                render(scope.$eval(alias.value));
            }]
        };
    }]);
});
