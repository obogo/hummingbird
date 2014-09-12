/* global app, query, parsers */
app.directives.model = function (module) {
    module.directive(module.name + 'model', function () {
        var $ = query;
        return {
            link: function (scope, el, alias) {
                var $el = $(el);

                scope.$watch(alias.value, function (newVal) {
                    el.value = newVal;
                });

                function eventHandler(evt) {
                    parsers.resolve(scope, alias.value, el.value);
                    scope.$apply();
                }

                $el.bind('change keyup blur input onpropertychange', eventHandler);

                scope.$on('$destroy', function () {
                    $el.unbindAll();
                });
            }
        };
    });
};
