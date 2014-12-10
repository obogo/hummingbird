/* global directives, utils */
directives.model = function (module) {
    module.directive('hbModel', function () {
        var $ = utils.query;
        return {
            link: function (scope, el, alias) {
                var $el = $(el);

                scope.$watch(alias.value, function (newVal) {
                    el.value = newVal;
                });

                function eventHandler(evt) {
                    utils.parsers.resolve(scope, alias.value, el.value);
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
