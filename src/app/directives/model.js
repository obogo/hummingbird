(function () {
    app.directives.model = function (module, namespace) {

        namespace = namespace || app.consts.PREFIX;

        module.directive(namespace + 'model', function (module) {
            var $ = query;
            return {
                link: function (scope, el, alias) {
                    var $el = $(el);

                    scope.$watch(alias.value, function (newVal) {
                        el.value = newVal;
                    });

                    function eventHandler(evt) {
                        scope.$resolve(alias.value, el.value);
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
}());