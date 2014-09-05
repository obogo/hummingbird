(function () {
    var framework = obogo.app.framework;
    var query = obogo.query;

    var module = framework.module('app');

    module.directive('uiMain', function () {
        return {
            link: function (scope, el) {
                scope.name = 'World';
            }
        }
    });

    module.directive('goModel', function () {
        return {
            link: function (scope, el) {
                function eventHandler(evt) {
                    scope.name = evt.target.value;
                    scope.$apply();
                }

                query(el).bind('change keyup blur', eventHandler);

                scope.$on('$destroy', function () {
                    query(el).unbindAll();
                });
            }
        }
    });
})();
