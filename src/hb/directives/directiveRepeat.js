//! pattern /hb\-directive-repeat\=/
internal('hbd.directiveRepeat', ['hb.directive', 'fromCamelToDash'], function (directive, fromCamelToDash) {
    directive('hbDirectiveRepeat', ['$app', function ($app) {
        return {
            link: ['scope', 'el', 'alias', function (scope, el, alias) {
                var itemProperty = scope.$eval(el.getAttribute('item-property'));
                var scopeProperty = scope.$eval(el.getAttribute('scope-property')) || 'model';
                var typeMap = scope.$eval(el.getAttribute('type-map'));
                var tpl = '';
                if (el.children.length) {
                    tpl = el.children[0].outerHTML;
                    el.innerHTML = '';
                }

                function removeUntil(len, list) {
                    var child;
                    var keepers = [];
                    var i, childrenLen, index;
                    // we loop through list and see if any of the elements are the ones that were in the list.
                    // if so we keep those and remove the ones around them rather than always blindly removing
                    // from the top down.
                    if (list && list.length) {
                        for (i = 0, childrenLen = el.children.length; i < childrenLen; i += 1) {
                            child = el.children[i];
                            index = list.indexOf(child.scope[scopeProperty]);
                            if (index !== -1) {
                                keepers.push(child);
                            }
                        }
                    }
                    i = 0;
                    child = el.children[i];// make it enter the first time.
                    while(child && el.children.length > len) {
                        child = el.children[i];
                        if (child.scope && child.scope !== scope && keepers.indexOf(child) === -1) {
                            child.scope.$destroy();
                            el.removeChild(child);
                            i -= 1;
                        } else if(!child.scope) {
                            el.removeChild(child);
                            i -= 1;
                        }
                        i += 1;
                    }
                }

                function render(list, oldList) {
                    // allow single item string properties.
                    var i = 0, len, child, s, dir, type, typeDash, itemTpl;
                    if (list && typeof list === "string" && list.length) {
                        list = [list];
                    }
                    if (list && list.length) {
                        len = list.length || 0;
                        removeUntil(len, list);
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
                                    s[scopeProperty] = list[i];
                                }
                                typeDash = fromCamelToDash(type);
                                itemTpl = tpl ? tpl.replace(/<(\/?\w+)/g, '<' + typeDash) : '<' + typeDash + '></' + typeDash + '>';
                                //console.log("\t" + itemTpl);
                                child = $app.addChild(el, itemTpl, s);
                            }
                            if (list[i]) {
                                s = child.scope;
                                s[scopeProperty] = list[i];
                                s.$index = i;
                            } else {
                                child.scope.$destroy();
                            }
                            i += 1;
                        }
                    } else {
                        removeUntil(0);
                    }
                    scope.$emit('hbDirectiveRepeat::render');
                }

                scope.$watch(alias.value, render, true);
                render(scope.$eval(alias.value));
            }]
        };
    }]);
});
