directives.bridge = function(module) {
    module.directive('hbBridge', function () {
        return {
            scope: true,
            link: function (scope, el, alias) {
                var ngScope = angular.element(el).scope(),
                    fire = scope.$$fire, i, unwatchers = [], len = el.attributes.length,
                    attr, name, $apply, fn, camelName, value;
                scope.$$fire = function (eventName, args) {
                    fire.call(scope, eventName, args);
                    var cloneArgs = args.slice();
                    cloneArgs.unshift(eventName);
                    ngScope.$emit.apply(ngScope, cloneArgs);
                    ngScope.$apply();
                };

                $apply = hb.utils.debounce(function () {
                    scope.$apply();
                });

                function getCamelName(name) {
                    var camel = name.split('-'), i, len = camel.length;
                    for (i = 0; i < len; i += 1) {
                        camel[i][0] = camel[i][0].toUpperCase();
                    }
                    return camel.join('');
                }

                function createUpdate(camelName) {
                    return function (newVal) {
                        scope[camelName] = newVal;
                        $apply();
                    }
                }

                for (i = 0; i < len; i += 1) {
                    attr = el.attributes[i];
                    name = attr.name || attr.nodeName || attr.localName;
                    camelName = getCamelName(name);
                    value = el.getAttribute(name);
                    // ignore angular directives and hb directives. All other attributes get mapped to the scope if they have a value.
                    if (value && name.indexOf('ng-') !== 0 && name !== module.name + '-id' && !module.val(camelName)) {
                        console.log('watching ' + name);
                        fn = createUpdate(camelName);
                        unwatchers.push(ngScope.$watch(value, fn, true));
                        fn(ngScope.$eval(value));// execute it immediately.
                    }
                }
                scope.$on('$destroy', function () {
                    while (unwatchers.length) {
                        unwatchers.pop()();
                    }
                });
            }
        };
    });
};