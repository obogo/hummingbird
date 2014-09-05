(function () {
    var framework = obogo.app.framework;
    var query = obogo.query;

    var module = framework.module('app');

    module.filter('upper', function () {
        return function (val) {
            return (val + '').toUpperCase();
        }
    });

    module.directive('goCloak', function () {
        return {
            link: function (scope, el) {
                el.removeAttribute('go-cloak');
            }
        }
    });

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

                var modelName = el.getAttribute('go-model');

                function eventHandler(evt) {
                    scope.name = evt.target.value;
                    scope.$apply();
                }

                query(el).bind('change keyup blur', eventHandler);

                scope.$on('$digest', function () {
                    el.value = scope[modelName];
                });

                scope.$on('$destroy', function () {
                    query(el).unbindAll();
                });
            }
        }
    });
})();
