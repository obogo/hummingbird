(function () {
    app.directives.model = function (name, module) {

        // TODO: Fix this to use internally "query"
        var $ = obogo.query;

        module.directive('goModel', function () {
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