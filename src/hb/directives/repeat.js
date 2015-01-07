internal('hbd.repeat', ['hb.directive', 'each'], function (directive, each) {
    directive('hbRepeat', function ($app) {

        function trimStrings(str, index, list) {
            list[index] = str && str.trim();
        }

        return {
            //scope:true,
            link: function (scope, el, alias) {
                var template = el.children[0].outerHTML;
                el.removeChild(el.children[0]);
                var statement = alias.value;
                statement = each.call({all: true}, statement.split(/\s+in\s+/), trimStrings);
                var itemName = statement[0],
                    watch = statement[1];

                function render(list, oldList) {
                    var i = 0, len = Math.max(list.length, el.children.length), child, s, data;
                    while (i < len) {
                        child = el.children[i];
                        if (!child) {
                            data = {};
                            data[itemName] = list[i];
                            data.$index = i;
                            child = $app.addChild(el, template, scope.$new(), data);
                        } else if (list[i]) {
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
});
